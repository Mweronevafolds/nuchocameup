import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPrice } from "@/data/products";
import { Trash2, Plus, LogOut, Pencil, BarChart3, ShoppingBag, CheckCircle, XCircle, Clock, Sparkles, Send } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { getAiProductDescription } from "@/utils/ai";

type AdminTab = "products" | "analytics" | "orders";

export default function Admin() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const { data: products, isLoading } = useProducts();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("analytics");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    original_price: "",
    description: "",
    sizes: "S,M,L",
    sold_out: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [lastSavedProduct, setLastSavedProduct] = useState<{ id: string, name: string, price: number } | null>(null);

  const broadcastDrop = async (templateName: string) => {
    if (!lastSavedProduct) return;

    const channelMap: Record<string, "email" | "sms" | "whatsapp"> = {
      mysterious: "email",
      hype: "sms",
      premium: "whatsapp",
    };
    const channel = channelMap[templateName] || "email";

    try {
      const { error } = await supabase.functions.invoke("broadcast-drop", {
        body: {
          productName: lastSavedProduct.name,
          price: formatPrice(lastSavedProduct.price),
          url: window.location.origin,
          templateType: templateName,
          channel,
        },
      });

      if (error) throw error;
      toast.success(`[ SIGNAL SENT ] ${channel.toUpperCase()} broadcast deployed.`);
    } catch (err) {
      console.error("Broadcast failed:", err);
      toast.error("Broadcast failed. Check Resend/Twilio configuration.");
    }
    
    setLastSavedProduct(null);
  };

  const generateDescription = async () => {
    if (!form.name) {
      toast.error("Please enter a product name first");
      return;
    }
    setGeneratingDesc(true);
    const desc = await getAiProductDescription(form.name);
    if (desc) {
      setForm({ ...form, description: desc });
      toast.success("Description generated!");
    } else {
      toast.error("AI generation failed");
    }
    setGeneratingDesc(false);
  };

  const resetForm = () => {
    setForm({ name: "", price: "", original_price: "", description: "", sizes: "S,M,L", sold_out: false });
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (product: any) => {
    setForm({
      name: product.name,
      price: String(product.price),
      original_price: String(product.original_price),
      description: product.description,
      sizes: product.sizes.join(","),
      sold_out: product.sold_out,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let image_url: string | undefined;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, imageFile);

      if (uploadError) {
        toast.error("Image upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      image_url = urlData.publicUrl;
      console.log("Image uploaded, URL:", image_url);
    }

    const productData = {
      name: form.name,
      price: parseInt(form.price),
      original_price: parseInt(form.original_price),
      description: form.description,
      sizes: form.sizes.split(",").map((s) => s.trim()),
      sold_out: form.sold_out,
      ...(image_url && { image_url }),
    };

    console.log("Saving product with data:", productData);

    const { error } = editingId
      ? await supabase.from("products").update(productData).eq("id", editingId)
      : await supabase.from("products").insert(productData);

    setSaving(false);

    if (error) {
      console.error("Database error:", error);
      toast.error("Database error: " + error.message);
      return;
    }

    if (!editingId) {
      setLastSavedProduct({ id: "new", name: productData.name, price: productData.price });
    }

    console.log("Product saved successfully!");
    toast.success(editingId ? "Product updated!" : "Product added!");
    queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.refetchQueries({ queryKey: ["products"] });
    resetForm();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted");
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  // ── Orders management (admin-only payment confirmation) ────────────────────
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items(product_name, quantity, size, product_price)`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "orders",
  });

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (profile && !profile.is_admin) return <Navigate to="/" replace />;

  const updateOrderStatus = async (orderId: string, status: string, trackingNumber?: string) => {
    const { error } = await supabase
      .from("orders")
      .update({
        order_status: status,
        ...(trackingNumber !== undefined && { tracking_number: trackingNumber }),
      })
      .eq("id", orderId);
    if (error) { toast.error("Update failed: " + error.message); return; }
    toast.success("✅ Order updated to " + status);
    refetchOrders();
  };

  const updateOrderPayment = async (orderId: string, status: "completed" | "failed") => {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: status,
        order_status: status === "completed" ? "processing" : "cancelled",
      })
      .eq("id", orderId);
    if (error) { toast.error("Update failed: " + error.message); return; }
    toast.success(status === "completed" ? "✅ Order marked as paid" : "❌ Order marked as cancelled");
    refetchOrders();
    queryClient.invalidateQueries({ queryKey: ["salesMetrics", "dailyRevenue", "productPerformance", "aiInsights"] });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-white selection:text-black">
      <main className="px-4 py-8 max-w-4xl mx-auto text-white">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <h1 className="text-2xl font-black font-display uppercase tracking-tighter">Admin Portal</h1>
        <div className="flex gap-4">
          {activeTab === "products" && (
            <button className="holo-btn px-4 py-2 flex items-center text-xs" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
              <Plus size={14} className="mr-2" /> {showForm ? "Cancel" : "Add Product"}
            </button>
          )}
          <button className="text-white/50 hover:text-white transition-colors" onClick={() => signOut()}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Notification Broadcast */}
      {lastSavedProduct && !showForm && (
        <div className="mb-8 border border-white/40 bg-white/10 p-6 animate-pulse-glow">
          <div className="flex items-center gap-3 mb-4 text-white">
            <Send size={18} />
            <h2 className="font-display font-bold uppercase tracking-widest text-sm">New Drop Detected: {lastSavedProduct.name}</h2>
          </div>
          <p className="text-xs font-mono-cyber text-white/50 uppercase mb-6">Select broadcast channel to notify the crew:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => broadcastDrop("mysterious")} className="text-[10px] font-mono-cyber border border-white/20 p-3 hover:bg-white hover:text-black transition-all uppercase tracking-widest">→ Email Channel</button>
            <button onClick={() => broadcastDrop("hype")} className="text-[10px] font-mono-cyber border border-white/20 p-3 hover:bg-white hover:text-black transition-all uppercase tracking-widest">→ SMS Channel</button>
            <button onClick={() => broadcastDrop("premium")} className="text-[10px] font-mono-cyber border border-white/20 p-3 hover:bg-white hover:text-black transition-all uppercase tracking-widest">→ WhatsApp Channel</button>
          </div>
          <button onClick={() => setLastSavedProduct(null)} className="mt-4 text-[9px] font-mono-cyber text-white/25 uppercase hover:text-white transition-colors underline">Dismiss</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-6 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 pb-4 font-mono-cyber text-xs uppercase tracking-widest transition-colors ${
            activeTab === "products" ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <Pencil size={14} /> Products
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 pb-4 font-mono-cyber text-xs uppercase tracking-widest transition-colors ${
            activeTab === "orders" ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <ShoppingBag size={14} /> Orders
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 pb-4 font-mono-cyber text-xs uppercase tracking-widest transition-colors ${
            activeTab === "analytics" ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <BarChart3 size={14} /> Analytics
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 space-y-4 border border-white/10 bg-white/5 p-6 rounded-xl">
              <h2 className="font-display font-bold text-white uppercase">{editingId ? "Edit Product" : "New Product"}</h2>
              <Input placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-transparent border-white/20 text-white placeholder:text-white/30" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Price (e.g. 1500)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="bg-transparent border-white/20 text-white placeholder:text-white/30" />
                <Input type="number" placeholder="Original price (e.g. 2000)" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} required className="bg-transparent border-white/20 text-white placeholder:text-white/30" />
              </div>
              <Input placeholder="Sizes (comma-separated: S,M,L,XL)" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} required className="bg-transparent border-white/20 text-white placeholder:text-white/30" />
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] uppercase tracking-widest text-white/50">Description</Label>
                  <button
                    type="button"
                    onClick={generateDescription}
                    disabled={generatingDesc}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {generatingDesc ? "Generating..." : <><Sparkles size={10} /> AI Generate</>}
                  </button>
                </div>
                <Textarea
                  placeholder="Product description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  className="bg-transparent border-white/20 text-white placeholder:text-white/30 min-h-[100px]"
                />
              </div>
              <div>
                <Label className="text-xs font-mono-cyber text-white/50 uppercase tracking-widest">Product Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mt-2 bg-transparent border-white/20 text-white/70" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Switch checked={form.sold_out} onCheckedChange={(v) => setForm({ ...form, sold_out: v })} />
                <Label className="text-xs font-mono-cyber text-white/50 uppercase">Mark as Sold out</Label>
              </div>
              <button type="submit" className="holo-btn w-full mt-4" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
              </button>
            </form>
          )}

          {isLoading ? (
            <p className="text-muted-foreground">Loading products...</p>
          ) : !products?.length ? (
            <p className="text-muted-foreground">No products yet. Add your first product!</p>
          ) : (
            <div className="space-y-4">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 border border-white/10 p-4 bg-white/5 hover:bg-white/10 transition-colors">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} className="h-16 w-16 object-cover bg-black" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold font-display text-white truncate uppercase">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1 font-mono-cyber">
                      <span className="text-xs text-white tracking-widest">{formatPrice(p.price)}</span>
                      <span className="text-[10px] text-white/30 line-through">{formatPrice(p.original_price)}</span>
                    </div>
                    {p.sold_out && <span className="text-[10px] uppercase font-mono-cyber text-white/50 bg-white/10 px-2 py-0.5 mt-2 inline-block">Sold out</span>}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 border border-white/10 text-white/50 hover:text-white hover:border-white/40 transition-colors" onClick={() => startEdit(p)}><Pencil size={14} /></button>
                    <button className="p-2 border border-white/10 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-colors" onClick={() => deleteProduct(p.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <p className="font-mono-cyber text-[10px] text-white/50 uppercase tracking-widest">[ LATEST 50 TRANSACTIONS ]</p>
            <button className="text-xs font-mono-cyber uppercase border border-white/10 px-3 py-1 hover:bg-white/5 transition-colors" onClick={() => refetchOrders()}>Refresh</button>
          </div>
          {orders.length === 0 && <p className="text-white/40 text-sm">No orders yet.</p>}
          {orders.map((o: any) => (
            <div key={o.id} className="border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/5 pb-3">
                <div>
                  <p className="font-mono-cyber text-[10px] text-white/40 tracking-widest">{o.id.slice(0, 8)}…</p>
                  <p className="text-sm font-bold text-white mt-1">{o.email} <span className="text-white/30">/</span> {o.phone_number}</p>
                  <p className="text-[10px] font-mono-cyber text-white/30 mt-1 uppercase">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-black text-lg text-white">KES {o.total_amount?.toLocaleString()}</p>
                  <span className={`inline-block text-[10px] px-2 py-0.5 mt-1 font-mono-cyber tracking-widest uppercase border ${
                    o.payment_status === "completed" ? "bg-white text-black border-white"
                    : o.payment_status === "failed"  ? "bg-transparent text-white/50 border-white/20"
                    : "bg-transparent text-white border-white/40"
                  }`}>
                    {o.payment_status === "completed" ? "[ PAID ]" : o.payment_status === "failed" ? "[ FAILED ]" : "[ PENDING ]"}
                  </span>
                </div>
              </div>

              {o.order_items?.length > 0 && (
                <div className="text-xs font-body text-white/50">
                  {o.order_items.map((item: any, i: number) => (
                    <span key={i} className="block">{item.quantity}x {item.product_name} <span className="text-white/30">({item.size})</span></span>
                  ))}
                </div>
              )}

              {/* Delivery info */}
              <div className="flex gap-4 text-[10px] font-mono-cyber uppercase tracking-widest text-white/30 border-t border-white/5 pt-2 mt-1">
                <span>{o.delivery_method}</span>
                {o.pickup_point_id && <span>Hub: {o.pickup_point_id}</span>}
              </div>

              {/* Status Management */}
              <div className="flex gap-2 pt-2 border-t border-white/5 mt-2 flex-wrap">
                {o.payment_status !== "completed" && (
                  <>
                    <button
                      className="text-[10px] font-mono-cyber uppercase tracking-widest px-3 py-1 border border-white/20 hover:bg-white hover:text-black transition-all flex items-center gap-2"
                      onClick={() => updateOrderPayment(o.id, "completed")}
                    >
                      <CheckCircle size={12} /> Force Paid
                    </button>
                    <button
                      className="text-[10px] font-mono-cyber uppercase tracking-widest px-3 py-1 border border-white/10 text-white/40 hover:text-white hover:border-white/40 transition-all flex items-center gap-2"
                      onClick={() => updateOrderPayment(o.id, "failed")}
                    >
                      <XCircle size={12} /> Force Cancel
                    </button>
                  </>
                )}

                {o.payment_status === "completed" && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      className="text-[10px] font-mono-cyber uppercase tracking-widest px-2 py-1 bg-black border border-white/20 text-white/70"
                      value={o.order_status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Delivered</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Tracking #"
                      defaultValue={o.tracking_number || ""}
                      onBlur={(e) => updateOrderStatus(o.id, o.order_status, e.target.value)}
                      className="text-[10px] font-mono-cyber uppercase tracking-widest px-2 py-1 bg-transparent border border-white/20 text-white/50 w-24 focus:w-48 transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <AnalyticsDashboard />
      )}
      </main>
    </div>
  );
}
