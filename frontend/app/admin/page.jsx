"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, BookOpen, BriefcaseBusiness, Check, ChevronRight,
  Clock3, FileText, GraduationCap, LayoutDashboard, LogOut, Menu,
  MessageSquare, Pencil, Plus, RefreshCw, Search, ShieldCheck,
  Trash2, UploadCloud, Users, X, LockKeyhole
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import "./admin.css";

const EMPTY = { stats: {}, users: [], activity: [] };
const fmt = (v) => new Intl.NumberFormat("en-US").format(Number(v) || 0);
const initials = (name, email) => (name || email || "U").split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(x => x[0].toUpperCase()).join("");
const dateText = (v) => { if (!v) return "—"; const d = new Date(v); return Number.isNaN(+d) ? "—" : d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}); };
const ago = (v) => { if (!v) return "Recently"; const n = Math.max(0, Date.now()-new Date(v).getTime()); if (!Number.isFinite(n)) return "Recently"; if(n<60000)return "Just now"; if(n<3600000)return `${Math.floor(n/60000)}m ago`; if(n<86400000)return `${Math.floor(n/3600000)}h ago`; return `${Math.floor(n/86400000)}d ago`; };
const isAdmin = (u) => ["admin","administrator"].includes(String(u.role || "").toLowerCase());

export default function AdminPage() {
  const router = useRouter();
  const auth = useAuth();
  const [data,setData] = useState(EMPTY);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [tab,setTab] = useState("Overview");
  const [query,setQuery] = useState("");
  const [menuOpen,setMenuOpen] = useState(false);
  const [modal,setModal] = useState(null);
  const [notice,setNotice] = useState("");

  const load = useCallback(async (quiet=false) => {
    quiet ? setBusy(true) : setLoading(true);
    setError("");
    try { setData(await api("/admin/overview")); }
    catch(e) { setError(e?.message || "Could not load admin data."); }
    finally { setLoading(false); setBusy(false); }
  },[]);
  useEffect(()=>{ load(); },[load]);

  const users = (data.users || []).filter(u => !isAdmin(u));
  const filtered = useMemo(()=>users.filter(u => [u.name,u.email,u.target_role,u.country].some(v=>String(v||"").toLowerCase().includes(query.toLowerCase()))),[users,query]);
  const stats = data.stats || {};
  const flash = (msg) => { setNotice(msg); setTimeout(()=>setNotice(""),3500); };
  async function signOut(){ try { await auth?.signOut?.(); } finally { router.replace("/admin/login"); } }
  async function deleteUser(user){
    if(!window.confirm(`Delete ${user.name || user.email || "this user"} and their Supabase Auth account? This cannot be undone.`)) return;
    setBusy(true); setError("");
    try { await api(`/admin/users/${encodeURIComponent(user.id)}`,{method:"DELETE"}); flash("User deleted."); await load(true); }
    catch(e){setError(e?.message || "Could not delete user.");}
    finally{setBusy(false);}
  }
  async function saveUser(form){
    setBusy(true); setError("");
    try {
      if(form.id){
        const payload = {...form}; delete payload.id; delete payload.email;
        await api(`/admin/users/${encodeURIComponent(form.id)}`,{method:"PATCH",body:payload});
        flash("User profile updated.");
      } else {
        await api("/admin/users",{method:"POST",body:form});
        flash("User account created.");
      }
      setModal(null); await load(true);
    } catch(e){setError(e?.message || "Could not save user.");}
    finally{setBusy(false);}
  }
  async function uploadFile(userId,kind,file){
    const base=process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const {getToken}=await import("@/lib/auth");
    const token=await getToken();
    const form=new FormData(); form.append("kind",kind); form.append("file",file);
    const res=await fetch(`${base}/api/admin/users/${encodeURIComponent(userId)}/files`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body.detail || "File upload failed.");
    flash("File uploaded."); await load(true);
  }

  const nav=[["Overview",LayoutDashboard],["Users",Users],["Activity",Activity]];
  const metrics=[
    ["Registered profiles",stats.users ?? users.length,Users,"teal","Profiles in the database"],
    ["Assessments",stats.assessments,GraduationCap,"blue","Sessions and results"],
    ["Practice attempts",stats.practice_attempts,BookOpen,"purple","Practice activity recorded"],
    ["Interviews",stats.interviews,MessageSquare,"orange","Interview sessions recorded"],
  ];

  return <div className="sa-shell">
    {menuOpen && <button className="sa-mobile-backdrop" aria-label="Close menu" onClick={()=>setMenuOpen(false)}/>}
    <aside className={`sa-sidebar ${menuOpen?"sa-sidebar-open":""}`}>
      <div className="sa-brand"><div className="sa-brand-mark">S</div><div className="sa-brand-copy"><strong>SkillSetra</strong><span>ADMIN CONSOLE</span></div><button className="sa-icon-button sa-mobile-close" onClick={()=>setMenuOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="sa-nav-label">WORKSPACE</div>
      <nav className="sa-nav">{nav.map(([label,Icon])=><button key={label} className={`sa-nav-item ${tab===label?"active":""}`} onClick={()=>{setTab(label);setMenuOpen(false);}}><Icon size={18}/><span>{label}</span>{label==="Users"&&<span className="sa-nav-count">{fmt(users.length)}</span>}{tab===label&&<ChevronRight className="sa-nav-chevron" size={15}/>}</button>)}</nav>
      <div className="sa-sidebar-bottom">
        <div className="sa-security-card"><div className="sa-security-icon"><LockKeyhole size={19}/></div><strong>Protected workspace</strong><p>Management actions are verified by the backend.</p><span className="sa-secure-status"><span/> Admin access</span></div>
        <button className="sa-signout" onClick={signOut}><LogOut size={17}/> Sign out</button>
        <div className="sa-sidebar-footer">SkillSetra © {new Date().getFullYear()}</div>
      </div>
    </aside>

    <main className="sa-main">
      <header className="sa-topbar"><div className="sa-topbar-left"><button className="sa-icon-button sa-menu-button" onClick={()=>setMenuOpen(true)} aria-label="Open menu"><Menu size={20}/></button><div className="sa-breadcrumb"><span>SkillSetra</span><ChevronRight size={14}/><strong>{tab}</strong></div></div><div className="sa-topbar-right"><div className="sa-live-status"><span className="sa-live-dot"/> Admin workspace</div><div className="sa-avatar sa-avatar-admin"><ShieldCheck size={18}/></div></div></header>
      <div className="sa-content">
        <section className="sa-welcome"><div><div className="sa-eyebrow"><span className="sa-eyebrow-line"/> SKILLSETRA MANAGEMENT</div><h1>{tab==="Overview"?"Dashboard overview":tab==="Users"?"User management":"Recent activity"}</h1><p>Manage accounts, career profiles, and learning activity from one secure workspace.</p></div><div className="sa-head-actions"><button className="sa-refresh-button" onClick={()=>load(true)} disabled={busy||loading}><RefreshCw size={15} className={busy?"sa-spinning":""}/>{busy?"Working...":"Refresh"}</button>{tab==="Users"&&<button className="sa-primary-button" onClick={()=>setModal({mode:"create"})}><Plus size={16}/> Add user</button>}</div></section>

        {notice&&<div className="sa-notice"><Check size={16}/>{notice}</div>}
        {error&&<div className="sa-error"><div><strong>Action could not be completed</strong><p>{error}</p></div><button onClick={()=>load()}>Retry</button></div>}

        {tab==="Overview"&&<>
          <section className="sa-metric-grid">{metrics.map(([label,value,Icon,color,detail])=><article className="sa-metric-card" key={label}><div className="sa-metric-top"><div className="sa-metric-label">{label}</div><div className={`sa-metric-icon ${color}`}><Icon size={20}/></div></div><div className="sa-metric-value">{loading?"—":fmt(value)}</div><div className="sa-metric-detail"><span className={`sa-detail-dot ${color}`}/>{detail}</div></article>)}</section>
          <section className="sa-account-grid">
            <article className="sa-panel sa-account-panel"><div className="sa-panel-heading"><div><h2>Account overview</h2><p>Regular profiles only. Administrator accounts are excluded.</p></div><div className="sa-panel-heading-icon"><Users size={18}/></div></div><div className="sa-account-total"><div><span>Registered users</span><strong>{loading?"—":fmt(users.length)}</strong></div><span className="sa-account-total-badge"><Check size={14}/> Admin accounts hidden</span></div><div className="sa-account-row"><div className="sa-account-label"><span className="sa-account-dot regular"/>Regular users</div><strong>{fmt(users.length)}</strong></div><div className="sa-account-track"><span className="sa-account-fill regular" style={{width:users.length?"100%":"0%"}}/></div><p className="sa-account-note">Admin access is controlled separately by the backend ADMIN_USER_IDS allowlist.</p></article>
            <article className="sa-panel sa-quick-panel"><div className="sa-panel-heading"><div><h2>Platform activity</h2><p>Feature usage recorded in your database</p></div><div className="sa-panel-heading-icon"><Activity size={18}/></div></div><div className="sa-quick-stats">{[["Learning records",stats.learning_records,BookOpen,"blue"],["Saved jobs",stats.saved_jobs,BriefcaseBusiness,"purple"],["Resume analyses",stats.resume_analyses,FileText,"orange"],["Job analyses",stats.job_analyses,BriefcaseBusiness,"teal"]].map(([label,value,Icon,color])=><div className="sa-quick-stat" key={label}><div className={`sa-quick-stat-icon ${color}`}><Icon size={17}/></div><div><span>{label}</span><strong>{fmt(value)}</strong></div></div>)}</div></article>
          </section>
          <ActivityPanel activity={(data.activity||[]).slice(0,6)} loading={loading} onViewAll={()=>setTab("Activity")}/>
          <UsersPanel users={filtered.slice(0,5)} loading={loading} query={query} setQuery={setQuery} onViewAll={()=>setTab("Users")} onEdit={u=>setModal({mode:"edit",user:u})} onDelete={deleteUser} onFiles={u=>setModal({mode:"files",user:u})}/>
        </>}

        {tab==="Users"&&<UsersPanel users={filtered} loading={loading} query={query} setQuery={setQuery} onAdd={()=>setModal({mode:"create"})} onEdit={u=>setModal({mode:"edit",user:u})} onDelete={deleteUser} onFiles={u=>setModal({mode:"files",user:u})}/>}
        {tab==="Activity"&&<ActivityPanel activity={data.activity||[]} loading={loading}/>}
        <footer className="sa-footer"><span><b>SkillSetra</b> Admin Console</span><span><span className="sa-live-dot"/> Secure workspace</span></footer>
      </div>
    </main>
    {modal&&<UserModal modal={modal} busy={busy} onClose={()=>setModal(null)} onSave={saveUser} onUpload={uploadFile}/>}
  </div>;
}

function UsersPanel({users,loading,query,setQuery,onViewAll,onAdd,onEdit,onDelete,onFiles}) {
  return <section className="sa-panel sa-table-panel">
    <div className="sa-panel-heading sa-table-heading"><div><h2>Registered users</h2><p>Manage profile details and account files</p></div><div className="sa-table-actions"><label className="sa-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search users..." aria-label="Search users"/>{query&&<button onClick={()=>setQuery("")} aria-label="Clear search"><X size={14}/></button>}</label>{onAdd&&<button className="sa-primary-button sa-small-primary" onClick={onAdd}><Plus size={15}/> Add user</button>}{onViewAll&&<button className="sa-text-button" onClick={onViewAll}>View all <ChevronRight size={14}/></button>}</div></div>
    <div className="sa-table-scroll"><table className="sa-table"><thead><tr><th>USER</th><th>TARGET ROLE</th><th>COUNTRY</th><th>JOINED</th><th className="sa-actions-heading">ACTIONS</th></tr></thead><tbody>
      {loading?<tr><td colSpan={5} className="sa-empty">Loading users...</td></tr>:users.length===0?<tr><td colSpan={5} className="sa-empty"><Users size={24}/><strong>No users found</strong><span>Try another search or add a user.</span></td></tr>:users.map((u,i)=><tr key={u.id||u.email||i}><td><div className="sa-user-cell"><div className="sa-avatar">{initials(u.name,u.email)}</div><div className="sa-user-info"><strong>{u.name||u.email?.split("@")[0]||"User"}</strong><span>{u.email||"No email available"}</span></div></div></td><td><span className="sa-target-role">{u.target_role||"Not specified"}</span></td><td>{u.country||"—"}</td><td className="sa-date-cell">{dateText(u.created_at)}</td><td><div className="sa-row-actions"><button title="Edit profile" aria-label="Edit profile" onClick={()=>onEdit?.(u)}><Pencil size={15}/></button><button title="Manage files" aria-label="Manage files" onClick={()=>onFiles?.(u)}><UploadCloud size={15}/></button><button className="danger" title="Delete user" aria-label="Delete user" onClick={()=>onDelete?.(u)}><Trash2 size={15}/></button></div></td></tr>)}
    </tbody></table></div>
  </section>;
}

function ActivityPanel({activity,loading,onViewAll}) {
  const iconFor=(c)=>({assessment:FileText,practice:GraduationCap,interview:MessageSquare,learning:BookOpen,job:BriefcaseBusiness,resume:FileText}[String(c||"").toLowerCase()]||Activity);
  return <section className="sa-panel sa-activity-panel"><div className="sa-panel-heading"><div><h2>Recent activity</h2><p>Latest recorded learning and career actions</p></div>{onViewAll&&<button className="sa-text-button" onClick={onViewAll}>View activity <ChevronRight size={14}/></button>}</div>{loading?<div className="sa-activity-empty">Loading activity...</div>:!activity.length?<div className="sa-activity-empty"><Clock3 size={22}/><strong>No activity recorded yet</strong><span>New activity appears here when available.</span></div>:<div className="sa-activity-list">{activity.map((item,i)=>{const Icon=iconFor(item.category);return <div className="sa-activity-item" key={item.id||i}><div className="sa-activity-icon"><Icon size={17}/></div><div className="sa-activity-copy"><strong>{item.title||"Platform activity"}</strong><span>{item.description||item.category||"Activity recorded"}</span></div><div className="sa-activity-time"><Clock3 size={12}/>{ago(item.created_at)}</div></div>})}</div>}</section>;
}

function UserModal({modal,busy,onClose,onSave,onUpload}) {
  const user=modal.user||{};
  const [form,setForm]=useState({id:user.id||"",name:user.name||"",email:user.email||"",password:"",target_role:user.target_role||"",country:user.country||"",status:user.status||"",experience:user.experience||"",goal:user.goal||"",dob:user.dob||"",headline:user.headline||"",bio:user.bio||"",education:user.education||"",experience_summary:user.experience_summary||"",role:user.role||"user"});
  const [kind,setKind]=useState("resume");
  const [file,setFile]=useState(null);
  const [localError,setLocalError]=useState("");
  const change=(key,value)=>setForm(old=>({...old,[key]:value}));
  async function submit(e){e.preventDefault();setLocalError("");try{if(modal.mode==="files"){if(!file)throw new Error("Choose a file first.");await onUpload(user.id,kind,file);onClose();return;}if(!form.name.trim())throw new Error("Name is required.");if(modal.mode==="create"&&(!form.email.trim()||form.password.length<8))throw new Error("Email and a password of at least 8 characters are required.");await onSave(form);}catch(e){setLocalError(e.message||"Could not complete action.");}}
  return <div className="sa-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="sa-modal" role="dialog" aria-modal="true" aria-labelledby="sa-modal-title"><header className="sa-modal-head"><div><h2 id="sa-modal-title">{modal.mode==="create"?"Add user":modal.mode==="edit"?"Edit user profile":"Manage user files"}</h2><p>{modal.mode==="create"?"Create a real Supabase Auth account and profile.":modal.mode==="edit"?"Update profile fields stored in Supabase.":`Upload a file for ${user.name||user.email||"this user"}.`}</p></div><button className="sa-icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></header>
    <form onSubmit={submit} className="sa-modal-form">
      {modal.mode==="files"?<><label>File category<select value={kind} onChange={e=>setKind(e.target.value)}><option value="resume">Resume</option><option value="avatar">Avatar</option><option value="attachment">Other attachment</option></select></label><label className="sa-file-drop"><UploadCloud size={25}/><strong>{file?file.name:"Choose a file to upload"}</strong><span>PDF, DOC, DOCX, PNG, JPG, WEBP or TXT · max 8 MB</span><input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt" onChange={e=>setFile(e.target.files?.[0]||null)}/></label></>:<>
        <div className="sa-form-grid"><label>Full name<input value={form.name} onChange={e=>change("name",e.target.value)} required maxLength={120}/></label>
        <label>Email address<input type="email" value={form.email} onChange={e=>change("email",e.target.value)} required disabled={modal.mode==="edit"}/></label>
        {modal.mode==="create"&&<label className="full">Temporary password<input type="password" value={form.password} onChange={e=>change("password",e.target.value)} minLength={8} required autoComplete="new-password"/><small>At least 8 characters. Share this securely with the user.</small></label>}
        <label>Target role<input value={form.target_role} onChange={e=>change("target_role",e.target.value)} placeholder="e.g. Data Analyst"/></label>
        <label>Country<input value={form.country} onChange={e=>change("country",e.target.value)} placeholder="e.g. India"/></label>
        <label>Date of birth<input type="date" value={form.dob||""} onChange={e=>change("dob",e.target.value)}/></label>
        <label>Experience<input value={form.experience} onChange={e=>change("experience",e.target.value)} placeholder="e.g. Early career"/></label>
        <label>Status<input value={form.status} onChange={e=>change("status",e.target.value)} placeholder="e.g. Student"/></label>
        <label>Profile permission<select value={form.role} onChange={e=>change("role",e.target.value)}><option value="user">User</option><option value="moderator">Moderator</option></select><small>Moderator assignment requires administrator authorization.</small></label>
        <label className="full">Career goal<input value={form.goal} onChange={e=>change("goal",e.target.value)} placeholder="What is this user working toward?"/></label>
        <label className="full">Headline<input value={form.headline} onChange={e=>change("headline",e.target.value)}/></label>
        <label className="full">Bio<textarea rows={3} value={form.bio} onChange={e=>change("bio",e.target.value)}/></label>
        <label>Education<input value={form.education} onChange={e=>change("education",e.target.value)}/></label>
        <label>Experience summary<input value={form.experience_summary} onChange={e=>change("experience_summary",e.target.value)}/></label></div>
      </>}
      {localError&&<div className="sa-form-error">{localError}</div>}
      <footer className="sa-modal-footer"><button type="button" className="sa-secondary-button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="sa-primary-button" disabled={busy}>{busy?"Saving...":modal.mode==="create"?"Create account":modal.mode==="edit"?"Save changes":"Upload file"}</button></footer>
    </form>
  </section></div>;
}
