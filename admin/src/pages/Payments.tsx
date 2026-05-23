import { useEffect, useState } from 'react';
import { FaCreditCard, FaSearch, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import api from '../services/api';
import { syncService } from '../services/SyncService';
import './Payments.css';

interface PaymeTransaction {
  id: number;
  paymeId: string;
  orderId?: number | null;
  enrollmentId?: number | null;
  amount: number;
  state: number;
  reason?: number | null;
  createTime: string;
  performTime?: string | null;
  cancelTime?: string | null;
}

const STATE_LABELS: Record<number, { label: string; className: string; icon: React.ReactElement }> = {
  1:  { label: "Yaratildi",      className: "badge-warning",  icon: <FaClock /> },
  2:  { label: "To'landi",       className: "badge-success",  icon: <FaCheckCircle /> },
  [-1]: { label: "Bekor (avval)", className: "badge-danger",  icon: <FaTimesCircle /> },
  [-2]: { label: "Bekor (keyin)", className: "badge-danger",  icon: <FaTimesCircle /> },
};

export default function Payments() {
  const [transactions, setTransactions] = useState<PaymeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransactions();
    // Refresh when a payment-linked order or enrollment changes (Payme callbacks broadcast these)
    const unsubOrder = syncService.subscribe('ORDER', fetchTransactions);
    const unsubEnrollment = syncService.subscribe('ENROLLMENT', fetchTransactions);
    return () => { unsubOrder(); unsubEnrollment(); };
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/admin/payme-transactions');
      setTransactions((response.data || []).sort(
        (a: PaymeTransaction, b: PaymeTransaction) =>
          new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      ));
    } catch (error) {
      console.error('Error fetching Payme transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter(tx => {
    const q = searchTerm.toLowerCase();
    return (
      tx.paymeId?.toLowerCase().includes(q) ||
      String(tx.orderId || '').includes(q) ||
      String(tx.enrollmentId || '').includes(q)
    );
  });

  const formatAmount = (tiyin: number) =>
    `${(tiyin / 100).toLocaleString('uz-UZ')} so'm`;

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString('uz-UZ') : '—';

  const entityLabel = (tx: PaymeTransaction) => {
    if (tx.orderId)      return `Buyurtma #${tx.orderId}`;
    if (tx.enrollmentId) return `Kurs yozilish #${tx.enrollmentId}`;
    return '—';
  };

  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaCreditCard /> Payme tranzaksiyalar</h1>
          <p>Barcha Payme to'lov tranzaksiyalari ({transactions.length} ta)</p>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Payme ID yoki buyurtma/kurs raqami..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Payme ID</th>
              <th>Buyurtma / Kurs</th>
              <th>Summa</th>
              <th>Holat</th>
              <th>Yaratilgan</th>
              <th>To'langan</th>
              <th>Bekor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tx => {
              const stateInfo = STATE_LABELS[tx.state] ?? { label: String(tx.state), className: 'badge-info', icon: <FaClock /> };
              return (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td className="mono" style={{ fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.paymeId}
                  </td>
                  <td>{entityLabel(tx)}</td>
                  <td><strong>{formatAmount(tx.amount ?? 0)}</strong></td>
                  <td>
                    <span className={`status-pill ${stateInfo.className}`}>
                      {stateInfo.icon} {stateInfo.label}
                    </span>
                  </td>
                  <td>{formatDate(tx.createTime)}</td>
                  <td>{formatDate(tx.performTime)}</td>
                  <td>{tx.cancelTime ? formatDate(tx.cancelTime) : '—'}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  Tranzaksiyalar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
