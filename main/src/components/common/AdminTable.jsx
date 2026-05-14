import React from 'react';

const AdminTable = ({ headers, children }) => {
    return (
        <div style={{
            background: 'var(--card-bg)',
            borderRadius: '15px',
            overflowX: 'auto',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                        {headers.map((header, index) => (
                            <th key={index} style={{ padding: '20px 15px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '14px' }}>
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export default AdminTable;
