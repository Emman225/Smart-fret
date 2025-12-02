import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { saveAs } from 'file-saver';
import { useAuth, useOrigines } from '../context/AppContext';
import useArmateurs from '../hooks/useArmateurs';
import { FolderIcon, GlobeIcon, BanknotesIcon, UserGroupIcon } from '../components/icons';
import { getDossiers } from '../services/dossierService';
import { getArmateursStats } from '../services/armateurService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HookData } from 'jspdf-autotable';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; className?: string; delay?: number }> = ({ title, value, icon, className, delay = 0 }) => (
  <div
    className={`relative overflow-hidden p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border border-slate-100 group animate-scale-up`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${className} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${className} text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow`}>
        {icon}
      </div>
    </div>
  </div>
);

const PieChart: React.FC<{ data: { label: string; value: number }[]; colors: string[]; size?: number; thickness?: number }> = ({ data, colors, size = 200, thickness = 28 }) => {
  const total = data.reduce((a, b) => a + (b.value || 0), 0) || 1;
  const radius = size / 2;
  const inner = radius - thickness;
  const cx = radius;
  const cy = radius;

  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const polar = (r: number, angle: number) => [cx + r * Math.cos(toRad(angle)), cy + r * Math.sin(toRad(angle))];
  const arc = (start: number, end: number) => {
    const [sx, sy] = polar(radius, start);
    const [ex, ey] = polar(radius, end);
    const [isx, isy] = polar(inner, end);
    const [iex, iey] = polar(inner, start);
    const large = end - start > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey} L ${isx} ${isy} A ${inner} ${inner} 0 ${large} 0 ${iex} ${iey} Z`;
  };

  let angle = 0;
  const paths = data.map((d, i) => {
    const portion = (d.value || 0) / total;
    const start = angle;
    const end = angle + portion * 360;
    angle = end;
    const path = arc(start, end);
    const color = colors[i % colors.length];
    return { path, color, label: d.label, value: d.value };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-8 space-y-6 sm:space-y-0">
      <div className="relative group">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform transition-transform duration-500 hover:scale-105">
          {paths.map((p, idx) => (
            <path
              key={idx}
              d={p.path}
              style={{ fill: p.color }}
              className="transition-opacity duration-300 hover:opacity-80 cursor-pointer"
            >
              <title>{`${p.label}: ${p.value}`}</title>
            </path>
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-2xl font-bold text-slate-800">{total}</span>
            <span className="text-xs text-slate-500 uppercase">Total</span>
          </div>
        </div>
      </div>
      <div className="space-y-3 w-full sm:w-auto">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between sm:justify-start sm:space-x-3 group cursor-default">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: colors[i % colors.length] }}></span>
              <span className="text-slate-600 text-sm font-medium group-hover:text-slate-900 transition-colors">{d.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-800 font-bold text-sm">{d.value}</span>
              <span className="text-slate-400 text-xs">({Math.round(((d.value || 0) / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChart: React.FC<{ data: { label: string; value: number }[]; maxBars?: number; colors?: string[] }> = ({ data, maxBars = 10, colors }) => {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, maxBars);
  const max = Math.max(...sorted.map(d => d.value), 1);
  const palette = colors && colors.length ? colors : Array.from({ length: sorted.length }, (_, i) => `hsl(${Math.round((220 + (i * 20)) % 360)}, 80%, 60%)`); // Blue-ish palette

  return (
    <div className="space-y-4">
      {sorted.map((d, i) => (
        <div key={`${d.label}-${i}`} className="group">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-slate-700 font-medium truncate mr-2 group-hover:text-blue-600 transition-colors">{d.label}</span>
            <span className="text-slate-600 font-semibold">{new Intl.NumberFormat('fr-FR').format(d.value)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: palette[i % palette.length] }}
            >
              <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { origines, fetchOrigines } = useOrigines();
  const { armateurs, fetchArmateurs } = useArmateurs();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDossiers, setTotalDossiers] = useState(0);
  const [recentDossiers, setRecentDossiers] = useState<any[]>([]);
  const [pageSample, setPageSample] = useState<any[]>([]);
  const [sampleSize, setSampleSize] = useState<number>(10);
  const [metric, setMetric] = useState<string>('bsc');
  const [barGroup, setBarGroup] = useState<'origine' | 'armateur'>('origine');
  const [barTopN, setBarTopN] = useState<number>(10);
  const [barSort, setBarSort] = useState<'asc' | 'desc'>('desc');

  const origineMap = useMemo(() => {
    const map = new Map<string, string>();
    origines.forEach(o => {
      const origineId = String((o as any).id || (o as any).idOrigine || (o as any).IdOrigine || '');
      const origineName = (o as any).nomPays || (o as any).NomPays || '';
      if (origineId) map.set(origineId, origineName);
    });
    return map;
  }, [origines]);

  const armateurMap = useMemo(() => {
    const map = new Map<string, string>();
    armateurs.forEach(a => {
      // The hook returns Armateur objects with IdArmat and NomArmat
      const id = String(a.IdArmat);
      const name = a.NomArmat;
      if (id) map.set(id, name);
    });
    return map;
  }, [armateurs]);

  useEffect(() => {
    if (fetchOrigines && origines.length === 0) fetchOrigines();
    if (fetchArmateurs && armateurs.length === 0) fetchArmateurs();
  }, []);



  const getMetricValue = (d: any, key: string) => {
    if (key === 'bsc') return Number(d.montantBSC) || 0;
    if (key === 'facture') return Number(d.montantFacture) || 0;
    if (key === 'cfa') return Number(d.montantCFA) || 0;
    if (key === 'assurance') return Number(d.montantAssurance) || 0;
    if (key === 'transit') return Number(d.montantTransit) || 0;
    if (key === 'tva_douane') return Number(d.montantTVADouane) || 0;
    if (key === 'ts_douane') return Number(d.montantTSDouane) || 0;
    if (key === 'tva_fact_trans') return Number(d.montantTVAFactTrans) || 0;
    if (key === 'tva_interv') return Number(d.montantTVAInterv) || 0;
    if (key === 'fret') return Number(d.fret?.montant) || 0;
    if (key === 'transport') return Number(d.transport?.montant) || 0;
    if (key === 'change') return Number(d.change?.montant) || 0;
    if (key === 'surestaire') return Number(d.surestaire?.montant) || 0;
    if (key === 'magasinage') return Number(d.magasinage?.montant) || 0;
    return 0;
  };
  const totalMetric = useMemo(() => pageSample.reduce((acc, d) => acc + getMetricValue(d, metric), 0), [pageSample, metric]);
  const formattedTotalMetric = useMemo(() => new Intl.NumberFormat('fr-FR').format(totalMetric), [totalMetric]);
  const uniqueOrigines = useMemo(() => new Set(pageSample.map(d => d.origine)).size, [pageSample]);
  const originCounts = useMemo(() => {
    const map = new Map<string, number>();
    pageSample.forEach(d => {
      const key = d.origine || 'Inconnu';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [pageSample]);
  const uniqueVendeurs = useMemo(() => new Set(pageSample.map(d => d.vendeur)).size, [pageSample]);
  const generatePalette = (n: number) => {
    const arr: string[] = [];
    for (let i = 0; i < n; i++) {
      const hue = Math.round((210 + (i * 30)) % 360); // Blue/Indigo/Purple range
      arr.push(`hsl(${hue}, 80%, 60%)`);
    }
    return arr;
  };

  const groupedBy = useMemo(() => {
    const map = new Map<string, number>();
    const key = barGroup;
    pageSample.forEach(d => {
      const label = String((key === 'origine' ? (d.origine || 'Inconnu') : (d.armateur || 'Inconnu')));
      const val = getMetricValue(d, metric);
      map.set(label, (map.get(label) || 0) + (isNaN(val) ? 0 : val));
    });
    let arr = Array.from(map.entries()).map(([label, value]) => ({ label, value }));
    arr.sort((a, b) => {
      const primary = barSort === 'desc' ? b.value - a.value : a.value - b.value;
      if (primary !== 0) return primary;
      return a.label.localeCompare(b.label);
    });
    return arr;
  }, [pageSample, barGroup, metric, barSort]);

  const armateurStats = useMemo(() => {
    if (pageSample.length === 0) return [];
    const statsMap = new Map<string, number>();
    pageSample.forEach((d: any) => {
      const armateurId = String(d.armateur || '');
      const teu = Number(d.nbreTEU) || 0;
      if (armateurId) {
        statsMap.set(armateurId, (statsMap.get(armateurId) || 0) + teu);
      }
    });

    return Array.from(statsMap.entries())
      .map(([id, teu]) => ({
        raison_sociale: armateurMap.get(id) || id,
        nombre_dossiers: teu
      }))
      .sort((a, b) => b.nombre_dossiers - a.nombre_dossiers);
  }, [pageSample, armateurMap]);

  const origineStats = useMemo(() => {
    if (pageSample.length === 0) return [];
    const statsMap = new Map<string, number>();
    pageSample.forEach((d: any) => {
      const origineId = String(d.origine || '');
      const teu = Number(d.nbreTEU) || 0;
      if (origineId) {
        statsMap.set(origineId, (statsMap.get(origineId) || 0) + teu);
      }
    });

    return Array.from(statsMap.entries())
      .map(([id, teu]) => ({
        raison_sociale: origineMap.get(id) || id,
        nombre_dossiers: teu
      }))
      .sort((a, b) => b.nombre_dossiers - a.nombre_dossiers);
  }, [pageSample, origineMap]);



  const exportBarCsv = () => {
    const rows = groupedBy.slice(0, barTopN);
    const header = 'Libellé;Valeur\n';
    const body = rows.map(r => `${String(r.label).replace(/\n/g, ' ').replace(/;/g, ',')};${r.value}`).join('\n');
    const csv = header + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const filename = `somme_${metric}_${barGroup}_${new Date().toISOString().slice(0, 10)}.csv`;
    saveAs(blob, filename);
  };

  const exportBarPng = () => {
    const rows = groupedBy.slice(0, barTopN);
    const width = 900;
    const barHeight = 24;
    const padding = 20;
    const labelWidth = 440;
    const valueWidth = 140;
    const gap = 12;
    const height = padding * 2 + rows.length * (barHeight + gap) + 40;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.font = 'bold 16px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    ctx.fillStyle = '#334155';
    const title = `Somme ${metric.toUpperCase()} par ${barGroup}`;
    ctx.fillText(title, padding, padding + 4);
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
    const max = Math.max(...rows.map(r => r.value), 1);
    const palette = generatePalette(rows.length);
    let y = padding + 28;
    rows.forEach((r, i) => {
      const color = palette[i % palette.length];
      ctx.fillStyle = '#1f2937';
      const label = String(r.label);
      // label truncation
      let displayLabel = label;
      const maxLabelChars = 40;
      if (displayLabel.length > maxLabelChars) displayLabel = displayLabel.slice(0, maxLabelChars - 1) + '…';
      ctx.fillText(displayLabel, padding, y + barHeight - 6);
      ctx.fillStyle = '#475569';
      const valStr = new Intl.NumberFormat('fr-FR').format(r.value);
      ctx.fillText(valStr, width - padding - valueWidth, y + barHeight - 6);
      const barX = padding + labelWidth;
      const fullBarW = width - padding - barX - valueWidth - 10;
      const barW = Math.max(2, (r.value / max) * fullBarW);
      ctx.fillStyle = color;
      ctx.fillRect(barX, y, barW, barHeight);
      y += barHeight + gap;
    });
    canvas.toBlob((blob) => {
      if (blob) {
        const filename = `somme_${metric}_${barGroup}_${new Date().toISOString().slice(0, 10)}.png`;
        saveAs(blob, filename);
      }
    });
  };

  const exportBarPdf = async () => {
    const rows = groupedBy.slice(0, barTopN);
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const primaryHex = ((import.meta as any).env?.VITE_PRIMARY_COLOR as string) || '#3b82f6';
    const hexToRgb = (h: string): [number, number, number] => {
      const s = h.replace('#', '');
      const full = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
      const n = parseInt(full, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const primaryRgb = hexToRgb(primaryHex);

    const loadLogo = async (): Promise<string | null> => {
      const envUrl = (import.meta as any).env?.VITE_DASHBOARD_LOGO_URL as string | undefined;
      const candidates = [envUrl, '/assets/download.jpg', 'assets/download.jpg', '/logo.png', '/vite.svg'].filter(Boolean) as string[];
      for (const url of candidates) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
          });
          const canvas = document.createElement('canvas');
          const size = 64;
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 0, 0, size, size);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
          ctx.strokeStyle = primaryHex;
          ctx.lineWidth = 3;
          ctx.stroke();
          const dataUrl = canvas.toDataURL('image/png');
          if (dataUrl && dataUrl.length > 20) return dataUrl;
        } catch { }
      }
      return null;
    };
    const logoDataUrl = await loadLogo();

    autoTable(doc, {
      head: [["Libellé", `Somme ${metric.toUpperCase()}`, "%"]],
      body: rows.map(r => [String(r.label), new Intl.NumberFormat('fr-FR').format(r.value), `${Math.round(((r.value || 0) / (totalMetric || 1)) * 100)}%`]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: primaryRgb, textColor: 255 },
      margin: { top: 130, left: 40, right: 40, bottom: 60 },
      didDrawPage: (data: HookData) => {
        if (logoDataUrl) {
          try { doc.addImage(logoDataUrl, 'PNG', 40, 40, 44, 44); } catch { }
        }
        doc.setFontSize(16);
        doc.setTextColor(primaryHex);
        doc.text('Rapport Dashboard', 88, 56);
        doc.setFontSize(12);
        doc.setTextColor('#475569');
        doc.text(`Date: ${dateStr}`, 88, 74);
        doc.text(`Métrique: ${metric.toUpperCase()}`, 88, 92);
        doc.text(`Groupe: ${barGroup}`, 260, 92);
        doc.text(`Échantillon: ${sampleSize}`, 380, 92);
        doc.text(`Total dossiers: ${totalDossiers}`, 88, 110);
        doc.text(`Total ${metric.toUpperCase()}: ${formattedTotalMetric}`, 260, 110);

        const footerY = pageH - 30;
        doc.setFontSize(10);
        doc.setTextColor('#64748b');
        doc.text(`Utilisateur: ${user?.username || '—'}`, 40, footerY);
        doc.text(`Page ${data.pageNumber}`, pageW - 80, footerY);
      }
    } as any);
    const filename = `rapport_${metric}_${barGroup}_${dateStr}.pdf`;
    doc.save(filename);
  };

  useEffect(() => {
    let isActive = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const dossiersRes = await getDossiers({ page: 1, per_page: sampleSize, sort_by: 'created_at', sort_order: 'desc' });
        if (!isActive) return;
        setTotalDossiers(dossiersRes.pagination?.total || dossiersRes.data.length);
        setRecentDossiers(dossiersRes.data.slice(0, Math.min(5, dossiersRes.data.length)));
        setPageSample(dossiersRes.data);


      } catch (e: any) {
        if (!isActive) return;
        setError(e?.message || 'Erreur lors du chargement des données');
      } finally {
        if (!isActive) return;
        setLoading(false);
      }
    };
    run();
    return () => { isActive = false; };
  }, [sampleSize]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-slate-500 mt-1">
            Bienvenue, <span className="font-semibold text-blue-600">{user?.username}</span>. Voici un aperçu de votre activité.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 px-2">
            <label htmlFor="sample-size" className="text-xs font-semibold text-slate-500 uppercase">Afficher</label>
            <select
              id="sample-size"
              value={sampleSize}
              onChange={(e) => setSampleSize(Number(e.target.value))}
              className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value={10}>10 derniers</option>
              <option value={25}>25 derniers</option>
              <option value={50}>50 derniers</option>
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center space-x-2 px-2">
            <label htmlFor="metric" className="text-xs font-semibold text-slate-500 uppercase">Métrique</label>
            <select
              id="metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="bsc">BSC</option>
              <option value="facture">Facture</option>
              <option value="cfa">CFA</option>
              <option value="assurance">Assurance</option>
              <option value="transit">Transit</option>
              <option value="tva_douane">TVA Douane</option>
              <option value="ts_douane">TS Douane</option>
              <option value="tva_fact_trans">TVA Facture Trans.</option>
              <option value="tva_interv">TVA Interv.</option>
              <option value="fret">Fret</option>
              <option value="transport">Transport</option>
              <option value="change">Change</option>
              <option value="surestaire">Surestaire</option>
              <option value="magasinage">Magasinage</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Nombre de dossiers" value={loading ? '...' : totalDossiers} icon={<FolderIcon className="w-6 h-6" />} className="from-blue-500 to-indigo-600" delay={100} />
        <StatCard title={`Montant ${metric.toUpperCase()}`} value={loading ? '...' : formattedTotalMetric} icon={<BanknotesIcon className="w-6 h-6" />} className="from-emerald-500 to-teal-600" delay={200} />
        <StatCard title="Origines" value={loading ? '...' : uniqueOrigines} icon={<GlobeIcon className="w-6 h-6" />} className="from-amber-500 to-orange-600" delay={300} />
        <StatCard title="Vendeurs" value={loading ? '...' : uniqueVendeurs} icon={<UserGroupIcon className="w-6 h-6" />} className="from-fuchsia-500 to-purple-600" delay={400} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Files */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Derniers dossiers</h2>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Temps réel</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {loading && recentDossiers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Chargement...</div>
            ) : recentDossiers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Aucun dossier récent</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentDossiers.map((d) => (
                  <div key={d.id} onClick={() => navigate(`/dossiers/${d.id}/edit`)} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FolderIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{d.numeroDossier || d.bl || d.id}</p>
                        <p className="text-xs text-slate-500 truncate">{d.vendeur}</p>
                        <p className="text-xs text-slate-500 truncate">Origine: {origineMap.get(String(d.origine)) || (typeof d.origine === 'string' ? d.origine : (d.origine?.nom || d.origine?.label || (d.origine as any)?.nomPays || (d.origine as any)?.NomPays || '—'))}</p>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <p className="text-sm font-bold text-slate-800">{new Intl.NumberFormat('fr-FR').format(getMetricValue(d, metric))}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">{metric}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Armateurs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Top Armateurs</h2>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">T.E.U</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {loading && armateurStats.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Chargement...</div>
            ) : armateurStats.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Aucune statistique disponible</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {armateurStats.slice(0, 5).map((a, idx) => (
                  <div key={`${a.raison_sociale}-${idx}`} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-800 truncate">{a.raison_sociale}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (a.nombre_dossiers / (armateurStats[0]?.nombre_dossiers || 1)) * 100)}%` }}></div>
                      </div>
                      <p className="text-xs font-bold text-slate-600 w-12 text-right">{a.nombre_dossiers} TEU</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Répartition par origines</h3>
          {origineStats.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Aucune donnée à afficher</div>
          ) : (
            <PieChart
              data={origineStats.slice(0, 10).map(s => ({ label: s.raison_sociale || 'Inconnu', value: s.nombre_dossiers || 0 }))}
              colors={generatePalette(Math.min(10, origineStats.length) || 1)}
              size={220}
              thickness={40}
            />
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Répartition par armateurs</h3>
          {armateurStats.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Aucune donnée à afficher</div>
          ) : (
            <PieChart
              data={armateurStats.slice(0, 10).map(s => ({ label: s.raison_sociale || 'Inconnu', value: s.nombre_dossiers || 0 }))}
              colors={generatePalette(Math.min(10, armateurStats.length) || 1)}
              size={220}
              thickness={40}
            />
          )}
        </div>
      </div>

      {/* <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Analyse détaillée</h3>
            <p className="text-sm text-slate-500">Somme {metric.toUpperCase()} par groupe</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg">
              <select value={barGroup} onChange={(e) => setBarGroup(e.target.value as any)} className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer">
                <option value="origine">Par Origine</option>
                <option value="armateur">Par Armateur</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg">
              <span className="text-xs font-semibold text-slate-500 pl-2">Top</span>
              <select value={barTopN} onChange={(e) => setBarTopN(Number(e.target.value))} className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg">
              <select value={barSort} onChange={(e) => setBarSort(e.target.value as any)} className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer">
                <option value="desc">Descendant</option>
                <option value="asc">Ascendant</option>
              </select>
            </div>
          </div>
        </div>

        {groupedBy.length === 0 ? (
          <div className="text-center py-10 text-slate-500">Aucune donnée disponible pour le graphique</div>
        ) : (
          <BarChart data={groupedBy} maxBars={barTopN} />
        )}

        <div className="flex justify-end mt-8 space-x-3">
          <button onClick={exportBarCsv} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            Exporter CSV
          </button>
          <button onClick={exportBarPng} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            Exporter PNG
          </button>
          <button onClick={() => { exportBarPdf(); }} className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors shadow-sm shadow-slate-900/10">
            Exporter PDF
          </button>
        </div>
      </div> */}
    </div >
  );
};

export default DashboardPage;
