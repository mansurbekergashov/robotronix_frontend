import { useState, useEffect, useMemo } from 'react';
import { FaHistory, FaUser, FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, FaCalendarAlt, FaDatabase, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import './Audit.css';

interface AuditLogData {
  id: number;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId?: number;
  details?: string;
  timestamp: string;
}

type DatePreset = '' | 'today' | 'week' | 'month' | 'custom';

export default function Audit() {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/audit-logs');
        setLogs(response.data);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return <FaPlus />;
    if (action.includes('UPDATE') || action.includes('EDIT')) return <FaEdit />;
    if (action.includes('DELETE')) return <FaTrash />;
    return <FaHistory />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return '#10b981';
    if (action.includes('UPDATE') || action.includes('EDIT')) return '#3b82f6';
    if (action.includes('DELETE')) return '#ef4444';
    return '#8b92a7';
  };

  const getDateRange = (): { from: Date | null; to: Date | null } => {
    const now = new Date();
    switch (datePreset) {
      case 'today': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { from: start, to: now };
      }
      case 'week': {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        return { from: start, to: now };
      }
      case 'month': {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        return { from: start, to: now };
      }
      case 'custom': {
        return {
          from: dateFrom ? new Date(dateFrom + 'T00:00:00') : null,
          to: dateTo ? new Date(dateTo + 'T23:59:59') : null,
        };
      }
      default:
        return { from: null, to: null };
    }
  };

  const clearDateFilter = () => {
    setDatePreset('');
    setDateFrom('');
    setDateTo('');
  };

  const filteredLogs = useMemo(() => {
    const { from, to } = getDateRange();

    return logs.filter(log => {
      const matchesSearch =
        log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter ? log.action.includes(actionFilter) : true;
      const matchesEntity = entityFilter ? log.resourceType === entityFilter : true;

      let matchesDate = true;
      if (from || to) {
        const logDate = new Date(log.timestamp);
        if (from && logDate < from) matchesDate = false;
        if (to && logDate > to) matchesDate = false;
      }

      return matchesSearch && matchesAction && matchesEntity && matchesDate;
    });
  }, [logs, searchTerm, actionFilter, entityFilter, datePreset, dateFrom, dateTo]);

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: AuditLogData[] } = {};
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('uz-UZ', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const uniqueEntities = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.resourceType))).sort();
  }, [logs]);

  const renderDetails = (details?: string) => {
    if (!details) return null;
    try {
      if (details.startsWith('{') || details.startsWith('[')) {
        const parsed = JSON.parse(details);
        return (
          <pre className="audit-json-details">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      }
    } catch (e) {
      // Not JSON, render as text
    }
    return <p className="audit-text-details">{details}</p>;
  };

  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaHistory /> Audit Jurnali</h1>
          <p>Tizimda amalga oshirilgan barcha o'zgarishlar ({filteredLogs.length} ta)</p>
        </div>
      </div>

      <div className="page-toolbar audit-toolbar">
        <div className="toolbar-left">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Admin yoki amal bo'yicha qidiruv..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="toolbar-right">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Barcha amallar</option>
              <option value="CREATE">Yaratish</option>
              <option value="UPDATE">O'zgartirish</option>
              <option value="DELETE">O'chirish</option>
            </select>
          </div>
          <div className="filter-group">
            <FaDatabase className="filter-icon" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Barcha bo'limlar</option>
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date filter section */}
      <div className="audit-date-filter">
        <div className="date-filter-label">
          <FaCalendarAlt /> Sana bo'yicha:
        </div>
        <div className="date-presets">
          <button
            className={`date-preset-btn ${datePreset === 'today' ? 'active' : ''}`}
            onClick={() => setDatePreset(datePreset === 'today' ? '' : 'today')}
          >
            Bugun
          </button>
          <button
            className={`date-preset-btn ${datePreset === 'week' ? 'active' : ''}`}
            onClick={() => setDatePreset(datePreset === 'week' ? '' : 'week')}
          >
            Oxirgi 7 kun
          </button>
          <button
            className={`date-preset-btn ${datePreset === 'month' ? 'active' : ''}`}
            onClick={() => setDatePreset(datePreset === 'month' ? '' : 'month')}
          >
            Oxirgi 30 kun
          </button>
          <button
            className={`date-preset-btn ${datePreset === 'custom' ? 'active' : ''}`}
            onClick={() => setDatePreset(datePreset === 'custom' ? '' : 'custom')}
          >
            Maxsus oraliq
          </button>
          {datePreset && (
            <button className="date-clear-btn" onClick={clearDateFilter} title="Tozalash">
              <FaTimes />
            </button>
          )}
        </div>
        {datePreset === 'custom' && (
          <div className="date-custom-range">
            <div className="date-input-group">
              <label>Boshlanish:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>Tugash:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="audit-timeline-container">
        {Object.keys(groupedLogs).length > 0 ? (
          Object.entries(groupedLogs).map(([date, items]) => (
            <div key={date} className="audit-date-group">
              <div className="audit-date-header">
                <FaCalendarAlt /> {date}
              </div>
              <div className="audit-timeline">
                {items.map((log) => (
                  <div key={log.id} className="audit-item">
                    <div className="audit-icon" style={{ background: getActionColor(log.action) }}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="audit-content">
                      <div className="audit-header">
                        <div className="audit-action-info">
                          <span className="audit-badge" style={{ background: `${getActionColor(log.action)}20`, color: getActionColor(log.action) }}>
                            {log.action}
                          </span>
                          <span className="audit-entity">
                            <FaDatabase /> {log.resourceType} {log.resourceId && `#${log.resourceId}`}
                          </span>
                        </div>
                        <div className="audit-time-info">
                          <span className="audit-time">
                            {new Date(log.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="audit-date-small">
                            {new Date(log.timestamp).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="audit-body">
                        {renderDetails(log.details)}
                      </div>

                      <div className="audit-footer">
                        <span className="audit-admin">
                          <FaUser /> {log.adminEmail}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">Audit jurnali bo'sh yoki kalit so'z bo'yicha hech narsa topilmadi</div>
        )}
      </div>
    </div>
  );
}
