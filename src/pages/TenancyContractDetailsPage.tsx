import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, FileText, Download, User } from 'lucide-react';
import { useTenancyContract, useUpdateTenancyContractStatus, useRenewTenancyContract } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { Avatar } from '@shared/ui/Avatar';
import { StatusBadge } from '@shared/ui/Badge';
import { PageLoader } from '@shared/ui/Spinner';
import { formatAed, formatDate } from '@shared/lib/format';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@shared/ui/Modal';
import { Field, Input } from '@shared/ui/Field';

export function TenancyContractDetailsPage() {
  const { id } = useParams();
  const { data: c, isLoading } = useTenancyContract(id);
  const updateStatus = useUpdateTenancyContractStatus();
  const renew = useRenewTenancyContract();
  const [renewModal, setRenewModal] = useState(false);
  const [renewForm, setRenewForm] = useState({ startDate: '', endDate: '', annualRent: '' });

  if (isLoading || !c) return <PageLoader />;

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({ id: c._id, status });
      toast.success(`Status updated to ${status}`);
    } catch {}
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await renew.mutateAsync({ id: c._id, payload: { ...renewForm, annualRent: Number(renewForm.annualRent) } });
      toast.success('Contract renewed successfully');
      setRenewModal(false);
    } catch {}
  };

  return (
    <>
      <PageHeader
        title={`Contract ${c.code}`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Tenancy Contracts' }, { label: c.code }]}
        actions={
          <>
             {c.status === 'ACTIVE' && (
                <button className="btn-secondary text-red-600 hover:bg-red-50" onClick={() => handleStatusChange('TERMINATED')}>Terminate</button>
             )}
             {c.status === 'EXPIRED' && (
                <button className="btn-primary" onClick={() => setRenewModal(true)}>Renew Contract</button>
             )}
             <Link to="/tenancy-contracts" className="btn-secondary"><ArrowLeft size={16} /> Back</Link>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
           <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
               <div>
                  <h2 className="text-xl font-bold">{c.code}</h2>
                  <div className="text-sm text-ink-500 mt-1 flex items-center gap-2">
                      <Calendar size={14} /> {formatDate(c.startDate)} → {formatDate(c.endDate)}
                  </div>
               </div>
               <StatusBadge status={c.status} />
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                  <p className="text-xs text-ink-500 font-semibold mb-1">Annual Rent</p>
                  <p className="text-lg font-bold">{formatAed(c.annualRent)}</p>
              </div>
              <div>
                  <p className="text-xs text-ink-500 font-semibold mb-1">Payment Schedule</p>
                  <p className="font-semibold">{c.paymentSchedule}</p>
              </div>
              <div>
                  <p className="text-xs text-ink-500 font-semibold mb-1">Security Deposit</p>
                  <p className="font-semibold">{formatAed(c.securityDeposit)}</p>
              </div>
              <div>
                  <p className="text-xs text-ink-500 font-semibold mb-1">Rent Due Date</p>
                  <p className="font-semibold">Day {c.rentDueDate || 1}</p>
              </div>
              <div>
                  <p className="text-xs text-ink-500 font-semibold mb-1">Late Fee</p>
                  <p className="font-semibold">{formatAed(c.lateFee || 0)}</p>
              </div>
              <div>
                  <p className="text-xs text-ink-500 font-semibold mb-1">Grace Period</p>
                  <p className="font-semibold">{c.gracePeriodDays || 0} Days</p>
              </div>
           </div>

           {(c.rules || c.notes) && (
             <div className="mt-8 border-t border-line pt-4">
               {c.rules && <div className="mb-4"><h3 className="text-sm font-bold mb-1">Rules & Terms</h3><p className="text-sm text-ink-700">{c.rules}</p></div>}
               {c.notes && <div><h3 className="text-sm font-bold mb-1">Internal Notes</h3><p className="text-sm text-ink-700">{c.notes}</p></div>}
             </div>
           )}
        </Card>

        <div className="space-y-4">
            <Card>
                <CardHeader title="Property Details" icon={<MapPin size={18} />} />
                <div className="mt-2">
                    <Link to={`/properties/${c.property._id}`} className="font-bold text-brand-700 hover:underline">{c.property.name}</Link>
                    <div className="text-sm text-ink-500">{c.property.code}</div>
                    <div className="text-sm mt-1">{c.property.location?.area}, {c.property.location?.city}</div>
                </div>
            </Card>

            <Card>
                <CardHeader title="Tenant Information" icon={<User size={18} />} />
                <div className="flex items-center gap-3 mt-3">
                   <Avatar src={c.tenant?.avatar} name={c.tenant?.name} />
                   <div>
                       <div className="font-semibold text-ink-900">{c.tenant?.name}</div>
                       <div className="text-xs text-ink-500">{c.tenant?.email}</div>
                       <div className="text-xs text-ink-500">{c.tenant?.phone}</div>
                   </div>
                </div>
            </Card>

            {c.contractFile && (
                <Card>
                    <CardHeader title="Documents" icon={<FileText size={18} />} />
                    <a href={c.contractFile} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-between p-3 rounded bg-slate-50 border border-line hover:border-brand-500 transition-colors">
                        <span className="text-sm font-semibold truncate">Tenancy_Contract.pdf</span>
                        <Download size={16} className="text-brand-700" />
                    </a>
                </Card>
            )}
        </div>
      </div>

      <Modal open={renewModal} onClose={() => setRenewModal(false)} title="Renew Contract" width="max-w-md">
          <form onSubmit={handleRenew} className="space-y-4">
             <Field label="New Start Date" required><Input type="date" required value={renewForm.startDate} onChange={(e) => setRenewForm({ ...renewForm, startDate: e.target.value })} /></Field>
             <Field label="New End Date" required><Input type="date" required value={renewForm.endDate} onChange={(e) => setRenewForm({ ...renewForm, endDate: e.target.value })} /></Field>
             <Field label="New Annual Rent" required><Input type="number" required value={renewForm.annualRent} onChange={(e) => setRenewForm({ ...renewForm, annualRent: e.target.value })} /></Field>
             <div className="flex justify-end gap-2 mt-6">
                 <button type="button" className="btn-secondary" onClick={() => setRenewModal(false)}>Cancel</button>
                 <button type="submit" className="btn-primary">Confirm Renewal</button>
             </div>
          </form>
      </Modal>
    </>
  );
}
