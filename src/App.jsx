import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react';
import logoLight from '../mfp.png';
import logoDark from '../mfp_dark.png';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const schoolDetails = {
  udiseCode: '19182803401',
  block: 'SONARPUR',
  circle: 'SONARPUR',
  district: 'SOUTH 24 PARGANAS',
  pin: '700150',
};

const initialValues = {
  issueDate: '',
  studentName: '',
  studentCode: '',
  pen: '',
  fatherName: '',
  motherName: '',
  address: '',
  district: '',
  dateOfBirth: '',
  lastClassPassed: '',
  lastClassAttended: '',
  academicSession: '',
  reason: '',
  transferDate: '',
  acknowledgementDate: '',
};

const fields = [
  {
    title: 'Student details',
    icon: UserRound,
    items: [
      { key: 'issueDate', label: 'Date of issue', type: 'date' },
      { key: 'studentName', label: "Student's full name", required: true },
      { key: 'studentCode', label: 'Student code' },
      { key: 'pen', label: 'PEN' },
      { key: 'fatherName', label: "Father's name" },
      { key: 'motherName', label: "Mother's name" },
      { key: 'address', label: 'Address', wide: true },
      { key: 'district', label: 'District' },
      { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
    ],
  },
  {
    title: 'School record',
    icon: GraduationCap,
    items: [
      { key: 'lastClassPassed', label: 'Last class passed' },
      { key: 'lastClassAttended', label: 'Last class attended' },
      { key: 'academicSession', label: 'Academic session' },
      {
        key: 'reason',
        label: 'Reason for transfer',
        type: 'select',
        options: [
          'Family Relocation / Transfer',
          'Distance from Residence',
          'Unability of Stream / Medium / Subjects',
          'Higher Class School Preferred',
          'Better Academic Opportunity',
          'Govt-Private School Transfer',
          'Other / Unknown Reason',
        ],
        wide: true,
      },
      { key: 'transferDate', label: 'Transfer date', type: 'date' },
    ],
  },
];

const formatDate = (date) => {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
};

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [theme, setTheme] = useState(() => localStorage.getItem('mfp-theme') || 'light');
  const [form, setForm] = useState(initialValues);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [messageError, setMessageError] = useState('');
  const [exporting, setExporting] = useState('');
  const certificateRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mfp-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) setMessageError(error.message);
        setSession(data.session);
      })
      .catch((error) => {
        setMessageError(`Could not check your sign-in session: ${error.message}`);
      })
      .finally(() => setAuthLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setMessageError('');
    });
    return () => subscription.unsubscribe();
  }, []);

  const filledFields = useMemo(
    () => fields.flatMap((section) => section.items).filter((field) => form[field.key].trim()).length,
    [form],
  );

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const signIn = async (event) => {
    event.preventDefault();
    setMessageError('');
    if (!supabase) {
      setMessageError('Supabase is not configured. Add your project URL and anon key to .env.local, then restart the app.');
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: login.email.trim(),
        password: login.password,
      });
      if (error) setMessageError(error.message);
    } catch (error) {
      setMessageError(`Could not sign in: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setMessageError(error.message);
    } catch (error) {
      setMessageError(`Could not sign out: ${error.message}`);
    }
  };

  const downloadPdf = async () => {
    if (!certificateRef.current) return;
    setExporting('pdf');
    let exportPaper;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      exportPaper = certificateRef.current.cloneNode(true);
      exportPaper.classList.add('pdf-export');
      Object.assign(exportPaper.style, {
        width: '794px',
        height: 'auto',
        minHeight: '1123px',
        minWidth: '0',
        maxWidth: 'none',
        aspectRatio: 'auto',
        overflow: 'visible',
        margin: '0',
        position: 'fixed',
        left: '-10000px',
        top: '0',
      });
      document.body.appendChild(exportPaper);
      const canvas = await html2canvas(exportPaper, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
      pdf.save(`transfer-certificate-${form.studentName.trim().replace(/\s+/g, '-').toLowerCase() || 'student'}.pdf`);
    } catch (error) {
      setMessageError(`Could not export PDF: ${error.message}`);
    } finally {
      exportPaper?.remove();
      setExporting('');
    }
  };

  const downloadDocx = async () => {
    setExporting('docx');
    try {
      const {
        Document,
        ImageRun,
        Packer,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        WidthType,
        AlignmentType,
        BorderStyle,
        HeightRule,
      } = await import('docx');
      const row = (label, value, options = {}) => new TableRow({
        children: [
          new TableCell({
            width: { size: options.labelWidth || 32, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: label, bold: true, color: '566257', size: 24 })] })],
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: value || ' ', size: 24 })] })],
          }),
        ],
      });
      const rows = [
        ['Date of issue', formatDate(form.issueDate)],
        ["Student's name", form.studentName],
        ['Student code', form.studentCode],
        ['PEN', form.pen],
        ["Father's name", form.fatherName],
        ["Mother's name", form.motherName],
        ['Address', form.address],
        ['District', form.district],
        ['Date of birth', formatDate(form.dateOfBirth)],
        ['Last class passed', form.lastClassPassed],
        ['Last class attended', form.lastClassAttended],
        ['Academic session', form.academicSession],
        ['Reason for transfer', form.reason],
        ['Date transferred', formatDate(form.transferDate)],
      ];
      const certificateTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3200, 6800],
        rows: rows.map(([label, value]) => row(label, value)),
      });
      const receiptRows = [
        ["Student's name", form.studentName],
        ["Father's name", form.fatherName],
        ['Student code', form.studentCode],
        ['Last class attended', form.lastClassAttended],
      ];
      const receiptTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3200, 6800],
        rows: receiptRows.map(([label, value]) => row(label, value)),
      });
      const logoResponse = await fetch(logoLight);
      if (!logoResponse.ok) throw new Error('The school logo could not be loaded.');
      const logoBytes = await logoResponse.arrayBuffer();
      const doc = new Document({
        sections: [{
          properties: {
            page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new ImageRun({ data: logoBytes, transformation: { width: 44, height: 44 } })],
              spacing: { after: 15 },
            }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: 'MATHURAPUR FREE PRIMARY SCHOOL', bold: true, size: 32, color: '185B3B' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 5 }, children: [new TextRun({ text: `(UDISE CODE: ${schoolDetails.udiseCode})`, size: 20 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 5 }, children: [new TextRun({ text: `BLOCK/MUNC./CORP.: ${schoolDetails.block},`, size: 20 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 10 }, children: [new TextRun({ text: `CIRCLE: ${schoolDetails.circle}, DIST.: ${schoolDetails.district}, PIN: ${schoolDetails.pin}`, size: 20 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [new TextRun({ text: 'TRANSFER CERTIFICATE', bold: true, size: 28 })] }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              columnWidths: [7200, 2800],
              rows: [new TableRow({
                height: { value: 900, rule: HeightRule.EXACT },
                children: [
                  new TableCell({
                    width: { size: 72, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    },
                    children: [new Paragraph(' ')],
                  }),
                  new TableCell({
                    width: { size: 28, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 6, color: '7E897F' },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: '7E897F' },
                      left: { style: BorderStyle.SINGLE, size: 6, color: '7E897F' },
                      right: { style: BorderStyle.SINGLE, size: 6, color: '7E897F' },
                    },
                    children: [new Paragraph(' ')],
                  }),
                ],
              })],
            }),
            certificateTable,
            new Paragraph({ spacing: { before: 35, after: 15 }, children: [new TextRun({ text: `Certified that the student has been transferred${form.transferDate ? ` on ${formatDate(form.transferDate)}` : ''}${form.reason ? ` for the following reason: ${form.reason}` : '.'}`, size: 24 })] }),
            new Paragraph({ spacing: { before: 25, after: 25 }, children: [new TextRun({ text: `Date: ${formatDate(form.issueDate)}`, size: 24 }), new TextRun({ text: '                                                     Head of Institution', size: 24 })] }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 10, after: 15 },
              border: { top: { style: BorderStyle.DASHED, size: 6, color: '6F7B70', space: 6 } },
              children: [new TextRun({ text: 'CUT HERE', size: 18, color: '667268' })],
            }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 15, after: 20 }, children: [new TextRun({ text: 'ACKNOWLEDGEMENT ON RECEIPT OF TRANSFER CERTIFICATE', bold: true, size: 24 })] }),
            receiptTable,
            new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: `Date: ${formatDate(form.acknowledgementDate) || '____________________'}                                 Signature of Guardian: ____________________`, size: 24 })] }),
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transfer-certificate-${form.studentName.trim().replace(/\s+/g, '-').toLowerCase() || 'student'}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessageError(`Could not export DOCX: ${error.message}`);
    } finally {
      setExporting('');
    }
  };

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light');

  if (authLoading) {
    return <main className="loading-screen"><LoaderCircle className="spin" size={28} /> Checking your session…</main>;
  }

  if (!session) {
    return (
      <main className="login-screen">
        <div className="login-theme"><button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button></div>
        <section className="login-card">
          <img className="login-logo" src={theme === 'light' ? logoLight : logoDark} alt="Mathurapur Free Primary School emblem" />
          <div className="eyebrow">STAFF PORTAL</div>
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to prepare student transfer certificates.</p>
          <form onSubmit={signIn} className="login-form">
            <label>Email address<input type="email" autoComplete="username" value={login.email} onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))} placeholder="name@school.edu" required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={login.password} onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))} placeholder="Enter your password" required /></label>
            {messageError && <div className="error-message" role="alert">{messageError}</div>}
            <button className="primary-button login-button" type="submit" disabled={authLoading}>{authLoading ? <LoaderCircle className="spin" size={18} /> : <>Sign in <ArrowRight size={17} /></>}</button>
          </form>
          <div className="login-footer">Secure access for school staff</div>
        </section>
        <div className="login-caption">MATHURAPUR FREE PRIMARY SCHOOL <span>·</span> ESTD. 1954</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Mathurapur Free Primary School home">
          <img src={theme === 'light' ? logoLight : logoDark} alt="" />
          <span><strong>Mathurapur</strong><small>Free Primary School</small></span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <button className="nav-item selected"><FileText size={18} /> Transfer certificates</button>
        <div className="sidebar-note">
          <div className="note-icon"><ClipboardList size={18} /></div>
          <strong>Ready to issue</strong>
          <p>Fill in the student record and export a print-ready certificate.</p>
        </div>
        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{session.user.email?.[0]?.toUpperCase() || 'S'}</div>
            <div className="user-info"><strong>School staff</strong><small>{session.user.email}</small></div>
            <button className="icon-button logout-button" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
          </div>
          <div className="school-caption">ESTABLISHED 1954</div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Documents <span>/</span> <strong>New certificate</strong></div>
          <div className="topbar-actions">
            <span className="secure-tag"><span /> Saved in this session</span>
            <button className="icon-button theme-switch" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
          </div>
        </header>
        <div className="workspace">
          <section className="editor-column">
            <div className="page-heading">
              <div className="eyebrow">STUDENT RECORDS <span>·</span> DOCUMENTS</div>
              <h1>Create transfer certificate</h1>
              <p>Enter the student’s details. The certificate and receipt update as you type.</p>
            </div>
            <div className="progress-card">
              <div className="progress-copy"><span className="progress-mark"><Check size={15} /></span><div><strong>Certificate details</strong><small>{filledFields} fields completed</small></div></div>
              <div className="progress-track"><span style={{ width: `${Math.min(100, Math.round(filledFields / fields.flatMap((section) => section.items).length * 100))}%` }} /></div>
            </div>

            {fields.map((section) => {
              const Icon = section.icon;
              return (
                <section className="form-card" key={section.title}>
                  <div className="form-card-heading"><div className="section-icon"><Icon size={17} /></div><div><h2>{section.title}</h2><p>{section.title === 'Student details' ? 'Enter the details as recorded in the school register.' : 'Record the final class and reason for leaving.'}</p></div></div>
                  <div className="field-grid">
                    {section.items.map((field) => <label className={`field ${field.wide ? 'field-wide' : ''}`} key={field.key}>
                      <span>{field.label}{field.required && <i> *</i>}</span>
                      {field.type === 'select' ? (
                        <select
                          value={form[field.key]}
                          onChange={(event) => updateForm(field.key, event.target.value)}
                          required={field.required}
                        >
                          <option value="">Select a reason</option>
                          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={form[field.key]}
                          onChange={(event) => updateForm(field.key, event.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          required={field.required}
                        />
                      )}
                    </label>)}
                  </div>
                </section>
              );
            })}
            <section className="form-card acknowledgement-form">
              <div className="form-card-heading"><div className="section-icon"><ClipboardList size={17} /></div><div><h2>Receipt acknowledgement</h2><p>Student details are copied from the certificate; enter the receipt date here.</p></div></div>
              <label className="field"><span>Date received</span><input type="date" value={form.acknowledgementDate} onChange={(event) => updateForm('acknowledgementDate', event.target.value)} /></label>
            </section>

            {messageError && <div className="error-message app-error" role="alert">{messageError}<button onClick={() => setMessageError('')} aria-label="Dismiss error">×</button></div>}
          </section>

          <section className="preview-column">
            <div className="preview-toolbar"><div><div className="preview-title">Live preview</div><span>Print layout <b>·</b> A4</span></div><div className="export-actions">
              <button className="secondary-button" onClick={downloadDocx} disabled={Boolean(exporting)}>{exporting === 'docx' ? <LoaderCircle size={16} className="spin" /> : <FileText size={16} />} DOCX</button>
              <button className="primary-button export-pdf" onClick={downloadPdf} disabled={Boolean(exporting)}>{exporting === 'pdf' ? <LoaderCircle size={16} className="spin" /> : <ArrowDownToLine size={16} />} PDF</button>
            </div></div>
            <div className="paper-viewport">
              <article className="certificate-paper" ref={certificateRef}>
                <div className="paper-header">
                  <img src={logoLight} alt="" />
                  <div className="paper-heading">
                    <h2>MATHURAPUR FREE PRIMARY SCHOOL</h2>
                    <div className="paper-school-details">
                      <p>(UDISE CODE: {schoolDetails.udiseCode})</p>
                      <p>BLOCK/MUNC./CORP.: {schoolDetails.block},</p>
                      <p>CIRCLE: {schoolDetails.circle}, DIST.: {schoolDetails.district}, PIN: {schoolDetails.pin}</p>
                    </div>
                    <p className="paper-title">TRANSFER CERTIFICATE</p>
                  </div>
                </div>
                <div className="paper-issue-date">Date of issue: {formatDate(form.issueDate) || <span className="blank-value">________________</span>}</div>
                <div className="paper-photo-space" aria-label="Blank space for attaching student photograph" />
                <div className="paper-fields">
                  <PaperField label="Student's name" value={form.studentName} />
                  <div className="paper-pair"><PaperField label="Student code" value={form.studentCode} /><PaperField label="PEN" value={form.pen} /></div>
                  <PaperField label="Father's name" value={form.fatherName} />
                  <PaperField label="Mother's name" value={form.motherName} />
                  <PaperField label="Address" value={form.address} />
                  <PaperField label="District" value={form.district} />
                  <PaperField label="Date of birth" value={formatDate(form.dateOfBirth)} />
                  <PaperField label="Last class passed" value={form.lastClassPassed} />
                  <PaperField label="Last class attended" value={form.lastClassAttended} />
                  <PaperField label="Academic session" value={form.academicSession} />
                </div>
                <div className="paper-reason"><h3>REASON FOR TRANSFER</h3><p>{form.reason || <span className="blank-value">Enter the reason for transfer</span>}</p><p className="certification-line">Certified that the student has been transferred{form.transferDate ? ` on ${formatDate(form.transferDate)}` : ' on __________________'}.</p></div>
                <div className="paper-signatures">
                  <div className="signature-date">Date: <span>{formatDate(form.issueDate) || '____________________'}</span></div>
                  <div className="signature-space"><div className="signature-line" /><strong>Head of Institution</strong><small>with Office Seal</small></div>
                </div>
                <div className="paper-cut-line"><span></span></div>
                <div className="receipt-block">
                  <h3>Acknowledgement on receipt of Transfer Certificate</h3>
                  <div className="receipt-fields">
                    <PaperField label="Student's name" value={form.studentName} />
                    <PaperField label="Father's name" value={form.fatherName} />
                    <div className="paper-pair"><PaperField label="Student code" value={form.studentCode} /><PaperField label="Last class attended" value={form.lastClassAttended} /></div>
                  </div>
                  <div className="receipt-signatures">
                    <div>Date: <span>{formatDate(form.acknowledgementDate) || '____________________'}</span></div>
                    <div className="guardian-signature"><div className="signature-line" /><strong>Signature of Guardian</strong></div>
                  </div>
                </div>
              </article>
            </div>
            <div className="preview-footnote"><span className="preview-status"><Check size={13} /> Preview is up to date</span><span>Signature areas are intentionally left blank</span></div>
          </section>
        </div>
      </section>
    </main>
  );
}

function PaperField({ label, value }) {
  return <div className="paper-field"><span>{label}</span><strong>{value || '\u00a0'}</strong></div>;
}

export default App;
