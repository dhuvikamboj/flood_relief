import React, { useState } from 'react';
import {
    IonButton,
    IonIcon,
    IonBadge,
    IonText,
    IonCard,
    IonCardContent,
    IonSpinner
} from '@ionic/react';
import { chevronUpOutline, chevronDownOutline, mapOutline, eyeOutline } from 'ionicons/icons';
import './DataTable.css';

export interface DataTableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    data: any[];
    columns: DataTableColumn[];
    loading?: boolean;
    onRowClick?: (row: any) => void;
    emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({
    data,
    columns,
    loading = false,
    onRowClick,
    emptyMessage = "No data available"
}) => {
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortColumn) return data;

        return [...data].sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            // Handle numeric values
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // Handle string values
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();

            if (sortDirection === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    }, [data, sortColumn, sortDirection]);

    if (loading) {
        return (
            <div className="data-table-loading">
                <IonSpinner name="crescent" />
                <IonText color="medium">
                    <p>Loading data...</p>
                </IonText>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="data-table-empty">
                <IonText color="medium">
                    <p>{emptyMessage}</p>
                </IonText>
            </div>
        );
    }

    return (
        <IonCard className="data-table-card">
            <IonCardContent>
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th 
                                        key={column.key}
                                        className={`data-table-header ${column.sortable ? 'sortable' : ''}`}
                                        onClick={() => column.sortable && handleSort(column.key)}
                                    >
                                        <div className="data-table-header-content">
                                            <span>{column.label}</span>
                                            {column.sortable && (
                                                <div className="data-table-sort-icons">
                                                    <IonIcon 
                                                        icon={chevronUpOutline} 
                                                        className={`sort-icon ${sortColumn === column.key && sortDirection === 'asc' ? 'active' : ''}`}
                                                    />
                                                    <IonIcon 
                                                        icon={chevronDownOutline} 
                                                        className={`sort-icon ${sortColumn === column.key && sortDirection === 'desc' ? 'active' : ''}`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="data-table-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((row, index) => (
                                <tr 
                                    key={row.id || index} 
                                    className={`data-table-row ${onRowClick ? 'clickable' : ''}`}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="data-table-cell">
                                            {column.render 
                                                ? column.render(row[column.key], row)
                                                : String(row[column.key] || '')
                                            }
                                        </td>
                                    ))}
                                    <td className="data-table-cell data-table-actions">
                                        <IonButton 
                                            size="small" 
                                            fill="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRowClick?.(row);
                                            }}
                                        >
                                            <IonIcon icon={eyeOutline} slot="icon-only" />
                                        </IonButton>
                                        {row.lat && row.lng && (
                                            <IonButton 
                                                size="small" 
                                                fill="clear"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(`https://www.google.com/maps/dir//${row.lat},${row.lng}`, '_blank');
                                                }}
                                            >
                                                <IonIcon icon={mapOutline} slot="icon-only" />
                                            </IonButton>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export default DataTable;
