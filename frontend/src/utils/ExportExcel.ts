import * as XLSX from 'xlsx';

interface Col { key: string; header: string; fmt?: (v: any) => string | number; }

function exportToExcel(data: Record<string, any>[], cols: Col[], sheet: string, file: string) {
  const rows = data.map(row => {
    const out: Record<string, any> = {};
    cols.forEach(c => { out[c.header] = c.fmt ? c.fmt(row[c.key]) : (row[c.key] ?? ''); });
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = cols.map(c => ({
    wch: Math.max(c.header.length, ...data.map(r => String(c.fmt ? c.fmt(r[c.key]) : (r[c.key] ?? '')).length)) + 2,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, `${file}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportEvents(events: any[]) {
  exportToExcel(events, [
    { key: 'id',          header: 'ID' },
    { key: 'title',       header: 'Titre' },
    { key: 'description', header: 'Description' },
    { key: 'date',        header: 'Date', fmt: v => v ? new Date(v).toLocaleDateString('fr-FR') : '' },
  ], 'Événements', 'LinkShare_Evenements');
}

export function exportMaterials(materials: any[]) {
  exportToExcel(materials, [
    { key: 'id',                  header: 'ID' },
    { key: 'nom',                 header: 'Nom' },
    { key: 'description',         header: 'Description' },
    { key: 'quantite_totale',     header: 'Quantité totale' },
    { key: 'quantite_disponible', header: 'Quantité disponible', fmt: v => Math.max(0, v ?? 0) },
    { key: 'quantite_reservee',   header: 'Quantité réservée',   fmt: v => Math.max(0, v ?? 0) },
    { key: 'etat',                header: 'État' },
  ], 'Stock matériel', 'LinkShare_Stock');
}