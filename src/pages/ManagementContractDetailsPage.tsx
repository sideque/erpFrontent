import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, DollarSign, ShieldCheck, FileText, Activity } from 'lucide-react';
import { useManagementContract, useUpdateManagementContractStatus, useRenewManagementContract } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { StatusBadge } from '@shared/ui/Badge';
import { PageLoader } from '@shared/ui/Spinner';
import { formatAed, formatDate } from '@shared/lib/format';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@shared/ui/Modal';
import { Field, Input } from '@shared/ui/Field';

export function ManagementContractDetailsPage() {
  const { id } = useParams();
  const { data: c, isLoading } = useManagementContract(id);
  const updateStatus = useUpdateManagementContractStatus();
  const renew = useRenewManagementContract();

  const [renewModal, setRenewModal] = useState(false);
  const [renewForm, setRenewForm] = useState({ contractStartDate: '', contractEndDate: '' });

  if (isLoading || !c) return <PageLoader />;

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ id: c._id, status });
      toast.success(`Contract status updated to ${status}`);
    } catch {}
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await renew.mutateAsync({ id: c._id, payload: renewForm });
      toast.success('Contract renewed successfully');
      setRenewModal(false);
    } catch {}
  };

  return (
    <>
      <PageHeader
        title="Contract Details"
        breadcrumbs={[{ label: 'Home' }, { label: 'Management Contracts' }, { label: 'Details' }]}
        actions={
          <div className="flex gap-2">
            {c.contractStatus === 'Active' ? (
              <button className="btn-secondary text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange('Terminated')}>Terminate</button>
            ) : (
              <button className="btn-primary" onClick={() => handleStatusChange('Active')}>Activate</button>
            )}
            <button className="btn-secondary" onClick={() => setRenewModal(true)}>Renew</button>
            <Link to="/management-contracts" className="btn-secondary"><ArrowLeft size={16} /> Back</Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Contract Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Contract Summary" icon={<FileText size={18} />} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4">
              <div><p className="text-xs text-ink-500 font-semibold mb-1 uppercase">Status</p><StatusBadge status={c.contractStatus} /></div>
              <div><p className="text-xs text-ink-500 font-semibold mb-1 uppercase">Start Date</p><p className="font-semibold">{formatDate(c.contractStartDate)}</p></div>
              <div><p className="text-xs text-ink-500 font-semibold mb-1 uppercase">End Date</p><p className="font-semibold">{formatDate(c.contractEndDate)}</p></div>
              <div><p className="text-xs text-ink-500 font-semibold mb-1 uppercase">Auto Renew</p><p className="font-semibold">{c.autoRenew ? 'Yes' : 'No'}</p></div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Financial Terms" icon={<DollarSign size={18} />} />
              <ul className="space-y-3 mt-4 text-sm">
                <li className="flex justify-between border-b border-line pb-2"><span>Commission</span><span className="font-bold">{c.commissionType === 'Percentage' ? `${c.commissionValue}%` : formatAed(c.commissionValue)}</span></li>
                <li className="flex justify-between border-b border-line pb-2"><span>Owner Share</span><span className="font-bold text-green-600">{c.ownerSharePercentage}%</span></li>
                <li className="flex justify-between border-b border-line pb-2"><span>Company Share</span><span className="font-bold text-brand-700">{c.companySharePercentage}%</span></li>
                <li className="flex justify-between"><span>Payment Cycle</span><span className="font-bold">{c.paymentCycle}</span></li>
              </ul>
            </Card>

            <Card>
              <CardHeader title="Expense Rules" icon={<ShieldCheck size={18} />} />
              <ul className="space-y-3 mt-4 text-sm">
                <li className="flex justify-between border-b border-line pb-2"><span>Responsibility</span><span className="font-bold">{c.expenseResponsibility}</span></li>
                <li className="flex justify-between border-b border-line pb-2"><span>Approval Required</span><span className="font-bold">{c.expenseApprovalRequired ? 'Yes' : 'No'}</span></li>
                <li className="flex justify-between"><span>Expense Limit</span><span className="font-bold">{c.expenseLimit ? formatAed(c.expenseLimit) : 'No Limit'}</span></li>
              </ul>
            </Card>
          </div>

          <Card>
            <CardHeader title="Management Permissions" icon={<Activity size={18} />} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <PermBadge label="Rent Collection" active={c.canCollectRent} />
              <PermBadge label="Tenant Management" active={c.canManageTenants} />
              <PermBadge label="Maintenance" active={c.canHandleMaintenance} />
              <PermBadge label="Property Listing" active={c.canListProperty} />
            </div>
          </Card>
        </div>

        {/* Right Column: Property & Owner */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Property" icon={<Building2 size={18} />} />
            <div className="mt-4">
              <p className="font-bold text-lg text-brand-700 underline"><Link to={`/properties/${c.propertyId?._id}`}>{c.propertyId?.name}</Link></p>
              <p className="text-sm text-ink-500 mt-1">{c.propertyId?.type} · {c.propertyId?.code}</p>
              <p className="text-xs text-ink-400 mt-2 flex items-center gap-1">
                 {c.propertyId?.location?.area}, {c.propertyId?.location?.city}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Owner" icon={<User size={18} />} />
            <div className="mt-4">
              <p className="font-bold text-ink-900">{c.ownerId?.name}</p>
              <p className="text-sm text-ink-500">{c.ownerId?.email}</p>
              <p className="text-sm text-ink-500">{c.ownerId?.phone}</p>
              <Link to={`/owners/${c.ownerId?._id}`} className="btn-secondary w-full mt-4 text-xs">View Owner Profile</Link>
            </div>
          </Card>

          {c.contractFileUrl && (
            <Card>
              <CardHeader title="Contract Document" icon={<FileText size={18} />} />
              <a href={c.contractFileUrl} target="_blank" rel="noreferrer" className="mt-4 block p-3 rounded-xl border border-dashed border-brand-300 bg-brand-50 text-brand-700 text-sm font-semibold text-center hover:bg-brand-100 transition">
                View PDF Contract
              </a>
            </Card>
          )}
        </div>
      </div>

      {/* Renewal Modal */}
      <Modal open={renewModal} onClose={() => setRenewModal(false)} title="Renew Contract" width="max-w-md">
        <form onSubmit={handleRenew} className="space-y-4">
          <Field label="New Start Date" required><Input type="date" required value={renewForm.contractStartDate} onChange={(e) => setRenewForm({ ...renewForm, contractStartDate: e.target.value })} /></Field>
          <Field label="New End Date" required><Input type="date" required value={renewForm.contractEndDate} onChange={(e) => setRenewForm({ ...renewForm, contractEndDate: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn-secondary" onClick={() => setRenewModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Renew & Activate</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function PermBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 ${active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
      <span className="text-[10px] font-bold uppercase tracking-tight leading-tight">{label}</span>
      <span className="text-xs font-bold">{active ? 'YES' : 'NO'}</span>
    </div>
  );
}
