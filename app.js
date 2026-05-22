// --- UPDATED DATA ACCESS OPERATIONS ---
// --- CONFIGURATION MANAGEMENT ---
const SUPABASE_URL = "https://dmddmjnefyaviibpqtod.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZGRtam5lZnlhdmlpYnBxdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDQxODksImV4cCI6MjA5NDg4MDE4OX0.ZcdboqU-DC_UQxXwPoF5W35BddEN1ghxMmVQLe_5iNU";

// Direct module import ensures the libraries are fully loaded before initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import exceljs from 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/+esm';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// --- VIEW ROUTING ENGINE ---
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const pageAnimal = document.getElementById('page-animal');
const pageClinic = document.getElementById('page-clinic');

document.getElementById('nav-animal').addEventListener('click', () => switchTab('animal'));
document.getElementById('nav-clinic').addEventListener('click', () => switchTab('clinic'));

const addAnimalBtn = document.querySelector('button[onclick*="animal-modal"]');
if (addAnimalBtn) {
    addAnimalBtn.removeAttribute('onclick');
    addAnimalBtn.addEventListener('click', () => toggleModal('animal-modal', true));
}

const addClinicBtn = document.querySelector('button[onclick*="clinic-modal"]');
if (addClinicBtn) {
    addClinicBtn.removeAttribute('onclick');
    addClinicBtn.addEventListener('click', () => toggleModal('clinic-modal', true));
}

const cancelAnimalBtn = document.querySelector('#animal-modal button[onclick*="false"]');
if (cancelAnimalBtn) {
    cancelAnimalBtn.removeAttribute('onclick');
    cancelAnimalBtn.addEventListener('click', () => toggleModal('animal-modal', false));
}

const cancelClinicBtn = document.querySelector('#clinic-modal button[onclick*="false"]');
if (cancelClinicBtn) {
    cancelClinicBtn.removeAttribute('onclick');
    cancelClinicBtn.addEventListener('click', () => toggleModal('clinic-modal', false));
}

document.getElementById('close-sig-viewer-btn')?.addEventListener('click', () => {
    toggleModal('signature-view-modal', false);
});

function switchTab(target) {
    if (target === 'animal') {
        pageAnimal.classList.remove('hidden');
        pageClinic.classList.add('hidden');
        document.getElementById('nav-animal').className = "px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-teal-400 transition";
        document.getElementById('nav-clinic').className = "px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-750 text-slate-300 transition";
    } else {
        pageAnimal.classList.add('hidden');
        pageClinic.classList.remove('hidden');
        document.getElementById('nav-clinic').className = "px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-teal-400 transition";
        document.getElementById('nav-animal').className = "px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-750 text-slate-300 transition";
    }
}

function toggleModal(id, open) {
    const el = document.getElementById(id);
    if (!el) return;
    if (open) { el.classList.remove('hidden'); el.classList.add('flex'); }
    else { el.classList.add('hidden'); el.classList.remove('flex'); }
}

// --- USER AUTHENTICATION STATE MACHINE ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        loadData();
    } else {
        currentUser = null;
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
});

document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Sign up error: " + error.message);
    else alert("Account registration successful! Check your email inbox for a confirmation verification link.");
});

document.getElementById('logout-btn').addEventListener('click', () => supabaseClient.auth.signOut());

// --- DATA ACCESS OPERATIONS ---
async function loadData() {
if (!currentUser) return;

    // Load Animals
const { data: animals } = await supabaseClient.from('animal_experience').select('*').order('date', { ascending: false });
const animalBody = document.getElementById('animal-table-body');
animalBody.innerHTML = '';
@@ -14,15 +113,10 @@ async function loadData() {
               <td class="p-4 font-mono text-teal-400">${row.hours}</td>
               <td class="p-4 max-w-xs truncate">${escapeHtml(row.duties)}</td>
               <td class="p-4 text-slate-400">${escapeHtml(row.contact_name)}</td>
                <td class="p-4"><button id="del-anim-${row.id}" class="text-rose-400 hover:text-rose-300 text-xs">Delete</button></td>
           </tr>
       `;
        setTimeout(() => {
            document.getElementById(`del-anim-${row.id}`)?.addEventListener('click', () => deleteRecord('animal_experience', row.id));
        }, 0);
});

    // Load Clinics
const { data: clinics } = await supabaseClient.from('clinic_experience').select('*').order('date', { ascending: false });
const clinicBody = document.getElementById('clinic-table-body');
clinicBody.innerHTML = '';
@@ -49,26 +143,185 @@ async function loadData() {
                   <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeClass}">${row.status}</span>
               </td>
               <td class="p-4 text-xs space-y-1">
                    <button id="edit-clinic-${row.id}" class="text-teal-400 hover:underline block">Edit</button>
                    ${!isApproved ? `<button id="invite-clinic-${row.id}" class="text-slate-400 hover:underline text-[11px] block">Invite</button>` : ''}
                    <button id="del-clin-${row.id}" class="text-rose-400 hover:underline block">Delete</button>
                    <button id="edit-clinic-${row.id}" class="text-teal-400 hover:underline block">Edit Entry</button>
                    ${!isApproved ? `<button id="invite-clinic-${row.id}" class="text-slate-400 hover:underline text-[11px] block">Invite Supervisor Link</button>` : ''}
               </td>
           </tr>
       `;

setTimeout(() => {
            document.getElementById(`edit-clinic-${row.id}`)?.addEventListener('click', () => editClinicRow(row.id, row.date, row.hours, row.duties, row.supervisor_email));
            document.getElementById(`del-clin-${row.id}`)?.addEventListener('click', () => deleteRecord('clinic_experience', row.id));
            // ... (keep the rest of your existing logic for view-sig and invite buttons)
            document.getElementById(`edit-clinic-${row.id}`)?.addEventListener('click', () => {
                editClinicRow(row.id, row.date, row.hours, row.duties, row.supervisor_email);
            });
            
            if (isApproved && row.signature_url) {
                document.getElementById(`view-sig-${row.id}`)?.addEventListener('click', () => {
                    const modalImg = document.getElementById('modal-signature-img');
                    if (modalImg) {
                        modalImg.src = row.signature_url;
                        toggleModal('signature-view-modal', true);
                    }
                });
            }

            if (!isApproved) {
                document.getElementById(`invite-clinic-${row.id}`)?.addEventListener('click', () => {
                    const url = window.location.origin + '/verify.html?id=' + row.id;
                    navigator.clipboard.writeText(url).then(() => {
                        alert('Verification link copied to clipboard automatically! You can now just paste it (Ctrl+V or Cmd+V) into an email to your supervisor.');
                    }).catch(err => {
                        alert('Could not copy automatically. Link is:\n\n' + url);
                    });
                });
            }
}, 0);
});
}

// --- NEW HELPER FUNCTION ---
async function deleteRecord(table, id) {
    if (confirm('Are you sure you want to permanently delete this entry?')) {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) alert(error.message);
        else loadData();
// --- MUTATION HANDLING ENGINE ---
document.getElementById('animal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        user_id: currentUser.id,
        experience_name: document.getElementById('anim-name').value,
        date: document.getElementById('anim-date').value,
        hours: parseFloat(document.getElementById('anim-hours').value),
        duties: document.getElementById('anim-duties').value,
        contact_name: document.getElementById('anim-contact').value
    };
    const { error } = await supabaseClient.from('animal_experience').insert([payload]);
    if (error) alert(error.message);
    else { toggleModal('animal-modal', false); document.getElementById('animal-form').reset(); loadData(); }
});

function editClinicRow(id, date, hours, duties, email) {
    document.getElementById('clinic-edit-id').value = id;
    document.getElementById('clin-date').value = date;
    document.getElementById('clin-hours').value = hours;
    document.getElementById('clin-duties').value = duties;
    document.getElementById('clin-email').value = email;
    toggleModal('clinic-modal', true);
}

document.getElementById('clinic-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('clinic-edit-id').value;
    const payload = {
        user_id: currentUser.id,
        date: document.getElementById('clin-date').value,
        hours: parseFloat(document.getElementById('clin-hours').value),
        duties: document.getElementById('clin-duties').value,
        supervisor_email: document.getElementById('clin-email').value,
        status: 'Pending', 
        supervisor_name: null,
        signature_url: null
    };

    let result;
    if (id) {
        result = await supabaseClient.from('clinic_experience').update(payload).eq('id', id);
    } else {
        result = await supabaseClient.from('clinic_experience').insert([payload]);
    }

    if (result.error) alert(result.error.message);
    else { 
        toggleModal('clinic-modal', false); 
        document.getElementById('clinic-form').reset(); 
        document.getElementById('clinic-edit-id').value = '';
        loadData(); 
}
});

// --- ADVANCED BINARY EXCEL GENERATOR WITH EMBEDDED IMAGES ---
document.getElementById('export-btn').addEventListener('click', async () => {
    const { data: animData } = await supabaseClient.from('animal_experience').select('*');
    const { data: clinData } = await supabaseClient.from('clinic_experience').select('*');

    // Create a new binary workbook using ExcelJS
    const workbook = new exceljs.Workbook();
    
    // 1. Add Animal Experience Sheet
    const ws1 = workbook.addWorksheet('Animal Experience');
    ws1.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Hours', key: 'hours', width: 12 },
        { header: 'Duties', key: 'duties', width: 40 },
        { header: 'Contact', key: 'contact', width: 30 }
    ];
    animData?.forEach(r => {
        ws1.addRow({ name: r.experience_name, date: r.date, hours: Number(r.hours), duties: r.duties, contact: r.contact_name });
    });

    // 2. Add Clinic Experience Sheet
    const ws2 = workbook.addWorksheet('Clinic Experience');
    ws2.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Hours', key: 'hours', width: 12 },
        { header: 'Duties', key: 'duties', width: 40 },
        { header: 'Supervisor Email', key: 'email', width: 25 },
        { header: 'Supervisor Name', key: 's_name', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Verification Signature File', key: 'sig', width: 25 }
    ];

    if (clinData) {
        for (let i = 0; i < clinData.length; i++) {
            const r = clinData[i];
            const currentRowNum = i + 2; // Rows are 1-indexed, header is row 1
            
            ws2.addRow({
                date: r.date,
                hours: Number(r.hours),
                duties: r.duties,
                email: r.supervisor_email,
                s_name: r.supervisor_name || 'N/A',
                status: r.status,
                sig: r.signature_url ? '' : 'No Signature Logged'
            });

            // If a signature drawing exists, decode it and embed it as an inline graphic
            if (r.signature_url && r.signature_url.startsWith('data:image')) {
                // Adjust row height to make space for the handwritten graphic
                ws2.getRow(currentRowNum).height = 55;
                
                const imageId = workbook.addImage({
                    base64: r.signature_url,
                    extension: 'png',
                });
                
                ws2.addImage(imageId, {
                    tl: { col: 6, row: currentRowNum - 1 },
                    ext: { width: 150, height: 65 },
                    editAs: 'undefined'
                });
            }
        }
    }

    // Style headers for both worksheets beautifully
    [ws1, ws2].forEach(ws => {
        ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ws.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Dark slate blue
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
        ws.getRow(1).height = 25;
    });

    // Write file binary buffer output directly to browser download trigger
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "VetTrack_Official_Milestones.xlsx";
    a.click();
    URL.revokeObjectURL(url);
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
