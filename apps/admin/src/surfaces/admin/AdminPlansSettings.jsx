import React from 'react';
import { Icon, Avatar, PaymentPill } from '../../components/Shared';
import { getPlans, createPlan, updatePlan, deletePlan, getMembers, getPayments, getSettings, updateSettings } from '../../lib/db';

function slugify(name) {
  return (name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `plan-${Date.now()}`;
}

function PlanCard({ plan, onEdit }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{plan.name}</div>
          <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{plan.sub}</div>
        </div>
        <div className="r-display r-tabular" style={{ fontSize: 20, color: 'var(--brand)', textAlign: 'right' }}>{plan.price}</div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{plan.description}</p>
      {plan.credits > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--steel)', background: 'var(--steel-tint)', padding: '2px 9px', borderRadius: 'var(--r-pill)' }}>{plan.credits} lesson credit{plan.credits>1?'s':''}</span>
        </div>
      )}
      <button onClick={() => onEdit(plan)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', marginTop: 4, padding: '7px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>Edit plan</button>
    </div>
  );
}

function PlanEditor({ plan, onClose, onSave, onDelete }) {
  const isNew = !plan?.id;
  const [form, setForm] = React.useState({ name: '', sub: '', price: '', credits: 0, description: '', ...plan });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const set = (patch) => setForm(f => ({ ...f, ...patch }));
  const field = { width: '100%', padding: '9px 11px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--paper)', font: 'inherit', fontSize: 13.5, color: 'var(--ink)', boxSizing: 'border-box' };

  const submit = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setError(null);
    setSaving(true);
    try {
      if (isNew) await onSave({ id: slugify(form.name), name: form.name.trim(), sub: form.sub, price: form.price, credits: Number(form.credits) || 0, description: form.description }, true);
      else await onSave({ name: form.name.trim(), sub: form.sub, price: form.price, credits: Number(form.credits) || 0, description: form.description }, false, plan.id);
      onClose();
    } catch (e) {
      setError(e?.message?.includes('duplicate') ? 'A plan with this name already exists.' : (e?.message || 'Could not save plan.'));
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(23,21,15,0.18)', zIndex: 40 }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, background: 'var(--surface)', borderLeft: '1px solid var(--hairline)', zIndex: 50, boxShadow: 'var(--shadow-raise)', display: 'flex', flexDirection: 'column', animation: 'r-panel 240ms var(--e-enter)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--hairline)' }}>
          <h2 className="r-display" style={{ margin: 0, fontSize: 20, color: 'var(--ink)' }}>{isNew ? 'New plan' : 'Edit plan'}</h2>
          <button onClick={onClose} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex' }}><Icon name="x" size={18} color="var(--muted)" /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Name', 'name', 'e.g. Competitor'], ['Subtitle', 'sub', 'e.g. Monthly subscription'], ['Price', 'price', 'e.g. €120/mo']].map(([label, key, ph]) => (
            <div key={key}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>{label}</div><input value={form[key] || ''} onChange={e => set({ [key]: e.target.value })} className="r-focusable" style={field} placeholder={ph} /></div>
          ))}
          <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Lesson credits</div><input type="number" value={form.credits} onChange={e => set({ credits: e.target.value })} className="r-focusable" style={field} /></div>
          <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Description</div><textarea value={form.description || ''} onChange={e => set({ description: e.target.value })} className="r-focusable" style={{ ...field, minHeight: 72, resize: 'vertical' }} /></div>
        </div>
        <div style={{ padding: '0 20px' }}>
          {error && <div style={{ marginBottom: 4, fontSize: 12.5, color: 'var(--danger)' }}>{error}</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: 20, borderTop: '1px solid var(--hairline)' }}>
          {!isNew && <button onClick={() => onDelete(plan.id)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', padding: '11px 14px', borderRadius: 'var(--r-btn)', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', fontSize: 13.5, fontWeight: 600 }}>Delete</button>}
          <button onClick={submit} disabled={saving} className="r-focusable" style={{ flex: 1, font: 'inherit', cursor: 'pointer', padding: 11, borderRadius: 'var(--r-btn)', border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13.5, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>{isNew ? 'Create plan' : 'Save changes'}</button>
        </div>
      </div>
      <style>{`@keyframes r-panel { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

const money = (n) => `€${Number(n || 0).toFixed(2)}`;
const shortDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

export function AdminPlans() {
  const [view, setView] = React.useState('catalogue');
  const [plans, setPlans] = React.useState([]);
  const [members, setMembers] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [editing, setEditing] = React.useState(null); // plan object or {} for new

  const loadPlans = React.useCallback(() => { getPlans().then(setPlans).catch(() => {}); }, []);
  React.useEffect(() => {
    loadPlans();
    getMembers().then(setMembers).catch(() => {});
    getPayments().then(setPayments).catch(() => {});
  }, [loadPlans]);

  const savePlan = async (data, isNew, id) => {
    if (isNew) await createPlan(data); else await updatePlan(id, data);
    loadPlans();
  };
  const removePlan = async (id) => { await deletePlan(id); setEditing(null); loadPlans(); };

  const subs = members.filter(m => m.plan_name);
  const dunning = members.filter(m => m.pay_status === 'overdue');
  const tabs = [['catalogue','Plan catalogue'],['subscriptions','Subscriptions'],['dunning','Dunning queue'],['invoices','Invoices']];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', padding: '0 24px' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setView(id)} className="r-focusable" style={{ font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', padding: '12px 16px', fontSize: 13.5, fontWeight: view===id ? 600 : 500, color: view===id ? 'var(--ink)' : 'var(--muted)', borderBottom: '2px solid ' + (view===id ? 'var(--brand)' : 'transparent'), transition: 'color var(--d-fast)', whiteSpace: 'nowrap' }}>
            {label}{id==='dunning'&&dunning.length>0&&<span style={{ marginLeft: 7, background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 'var(--r-pill)', padding: '1px 6px' }}>{dunning.length}</span>}
          </button>
        ))}
      </div>
      <div key={view} style={{ flex: 1, overflowY: 'auto', padding: 24, animation: 'r-fade 160ms var(--e-standard)' }}>
        {view === 'catalogue' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {plans.map(p => <PlanCard key={p.id} plan={p} onEdit={setEditing} />)}
            <div onClick={() => setEditing({})} style={{ background: 'transparent', border: '1px dashed var(--hairline)', borderRadius: 'var(--r-card)', padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 160 }}>
              <div style={{ textAlign: 'center', color: 'var(--faint)' }}>
                <Icon name="plus" size={22} color="var(--faint)" />
                <div style={{ fontSize: 13, marginTop: 8 }}>New plan</div>
              </div>
            </div>
          </div>
        )}
        {view === 'subscriptions' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--faint)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {['Athlete','Plan','Credits','Status'].map(h => <th key={h} style={{ padding: '11px 16px', fontWeight: 600, borderBottom: '1px solid var(--hairline)', background: 'var(--surface)' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 && <tr><td colSpan="4" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No subscriptions yet.</td></tr>}
                {subs.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < subs.length-1 ? '1px solid var(--hairline)' : 'none', animation: `r-rise var(--d-base) var(--e-enter) ${i*30}ms both` }}>
                    <td style={{ padding: '11px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.name} size={28} src={s.avatar_url} /><span style={{ fontWeight: 500, color: 'var(--ink)' }}>{s.name}</span></div></td>
                    <td style={{ padding: '11px 16px', color: 'var(--muted)' }}>{s.plan_name}</td>
                    <td className="r-tabular" style={{ padding: '11px 16px', color: 'var(--muted)' }}>{s.credits}</td>
                    <td style={{ padding: '11px 16px' }}><PaymentPill status={s.pay_status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {view === 'dunning' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dunning.length === 0 ? (
              <div style={{ padding: '12px 14px', background: 'var(--success-tint)', border: '1px solid var(--success)', borderRadius: 'var(--r-card)', fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>No overdue accounts. Everyone is up to date.</div>
            ) : (
              <>
                <div style={{ padding: '12px 14px', background: 'var(--danger-tint)', border: '1px solid var(--danger)', borderRadius: 'var(--r-card)', fontSize: 13, color: 'var(--danger)', fontWeight: 500 }}>
                  {dunning.length} overdue account{dunning.length>1?'s':''} need follow-up.
                </div>
                {dunning.map((d, i) => (
                  <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderLeft: '3px solid var(--danger)', borderRadius: 'var(--r-card)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Avatar name={d.name} size={36} src={d.avatar_url} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>{d.plan_name || '—'}</div>
                    </div>
                    <PaymentPill status="overdue" size="sm" />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        {view === 'invoices' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All payments</span>
            </div>
            {payments.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No payments recorded yet.</div>}
            {payments.map((r, i, a) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < a.length-1 ? '1px solid var(--hairline)' : 'none' }}>
                <div className="r-mono" style={{ fontSize: 11.5, color: 'var(--faint)', width: 90, textTransform: 'capitalize' }}>{r.kind}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{r.members?.name || 'Member'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{r.note || '—'}</div>
                </div>
                <span className="r-tabular" style={{ fontSize: 13, color: 'var(--muted)' }}>{money(r.amount)}</span>
                <span className="r-tabular" style={{ fontSize: 12, color: 'var(--faint)', width: 52, textAlign: 'right' }}>{shortDate(r.created_at)}</span>
                <PaymentPill status={r.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
      {editing && <PlanEditor plan={editing} onClose={() => setEditing(null)} onSave={savePlan} onDelete={removePlan} />}
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--faint)', margin: '0 0 12px' }}>{title}</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// Inline-editable settings row: commits on blur / Enter. `type` is 'text' or
// 'number'; `suffix` is a trailing unit label (e.g. "h", "days").
function EditableRow({ label, sub, value, onCommit, type = 'text', suffix, placeholder, last }) {
  const [draft, setDraft] = React.useState(value ?? '');
  React.useEffect(() => { setDraft(value ?? ''); }, [value]);
  const commit = () => {
    const next = type === 'number' ? (draft === '' ? null : Number(draft)) : draft.trim();
    if (next !== value) onCommit(next);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: last ? 'none' : '1px solid var(--hairline)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type={type} value={draft} placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          className="r-focusable"
          style={{ width: type === 'number' ? 70 : 190, padding: '7px 10px', borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'var(--paper)', font: 'inherit', fontSize: 13.5, color: 'var(--ink)', textAlign: type === 'number' ? 'right' : 'left', boxSizing: 'border-box' }}
        />
        {suffix && <span style={{ fontSize: 13, color: 'var(--faint)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

export function AdminSettings() {
  const [s, setS] = React.useState(null);

  React.useEffect(() => { getSettings().then(setS).catch(() => {}); }, []);

  const persist = (patch) => {
    setS(prev => ({ ...prev, ...patch }));
    updateSettings(patch).catch(() => {});
  };

  const v = s || {};

  return (
    <div style={{ maxWidth: 640, padding: '20px 24px', overflowY: 'auto', height: '100%' }}>
      <SettingsSection title="Club profile">
        <EditableRow label="Club name" value={v.club_name ?? ''} placeholder="e.g. Riposte Salle d'Armes" onCommit={val => persist({ club_name: val })} />
        <EditableRow label="City" value={v.city ?? ''} placeholder="e.g. Bucharest, Romania" onCommit={val => persist({ city: val })} />
        <EditableRow label="Contact email" type="text" value={v.contact_email ?? ''} placeholder="admin@club.ro" onCommit={val => persist({ contact_email: val })} last />
      </SettingsSection>
      <SettingsSection title="Session rules">
        <EditableRow label="Cancellation window" sub="Free cancellation up to this many hours before" type="number" suffix="h" value={v.cancellation_window_hours ?? 12} onCommit={val => persist({ cancellation_window_hours: val })} />
        <EditableRow label="Dunning offset" sub="Days after due before first reminder" type="number" suffix="days" value={v.dunning_offset_days ?? 3} onCommit={val => persist({ dunning_offset_days: val })} last />
      </SettingsSection>
    </div>
  );
}
