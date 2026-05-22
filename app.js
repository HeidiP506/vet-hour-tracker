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

document.getElementById('add-animal-trigger').addEventListener('click', () => {
    document.getElementById('animal-modal-title').innerText = "Add Animal Experience";
    document.getElementById('animal-edit-id').value = '';
    document.getElementById('animal-form').reset();
    toggleModal('animal-modal', true);
});

document.getElementById('add-clinic-trigger').addEventListener('click', () => {
    document.getElementById('clinic-modal-title').innerText = "Log Clinical Veterinary Shift";
    document.getElementById('clinic-edit-id').value = '';
    document.getElementById('clinic-form').reset();
    toggleModal('clinic-modal', true);
});

document.getElementById('cancel-animal-btn').addEventListener('click', () => toggleModal('animal-modal', false));
document.getElementById('cancel-clinic-btn').addEventListener('click', () => toggleModal('clinic-modal', false));

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
    
    // Load Animal Experiences
    const { data: animals } = await supabaseClient.from('animal_experience').select('*').order('start_date', { ascending: false });
    const animalBody = document.getElementById('animal-table-body');
    animalBody.innerHTML = '';
    animals?.forEach(row => {
        const dateRangeDisplay = row.end_date ? `${row.start_date} to ${row.end_date}` : row.start_date;
        animalBody.innerHTML += `
            <tr class="hover:bg-slate-750 transition">
                <td class="p-4 font-semibold text-slate-200">${escapeHtml(row.experience_name)}</td>
                <td class="p-4 whitespace-nowrap">${dateRangeDisplay}</td>
                <td class="p-4 font-mono text-teal-400">${row.hours}</td>
                <td class="p-4 max-w-xs truncate">${escapeHtml(row.duties)}</td>
                <td class="p-4 text-slate-400">${escapeHtml(row.contact_name)}</td>
                <td class="p-4 text-xs">
                    <button id="edit-animal-${row.id}" class="text-teal-400 hover:underline block">Edit Entry</button>
                </td>
            </tr>
        `;
        
        setTimeout(() => {
            document.getElementById(`edit-animal-${row.id}`)?.addEventListener('click', () => {
                editAnimalRow(row.id, row.experience_name, row.start_date, row.end_date, row.hours, row.duties, row.contact_name);
            });
        }, 0);
    });

    // Load Clinic Shifts
    const { data: clinics } = await supabaseClient.from('clinic_experience').select('*').order('start_date', { ascending: false });
    const clinicBody = document.getElementById('clinic-table-body');
    clinicBody.innerHTML = '';
    clinics?.forEach(row => {
        const isApproved = row.status === 'Approved';
        const badgeClass = isApproved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        const dateRangeDisplay = row.end_date ? `${row.start_date} to ${row.end_date}` : row.start_date;
        
        let signatureActionHtml = '<span class="text-slate-500 italic">Unsigned</span>';
        if (isApproved && row.signature_url) {
            signatureActionHtml = `<button id="view-sig-${row.id}" class="text-teal-400 hover:underline flex items-center">👁️ View Signature</button>`;
        }

        clinicBody.innerHTML += `
            <tr class="hover:bg-slate-750 transition">
                <td class="p-4 whitespace-nowrap">${dateRangeDisplay}</td>
                <td class="p-4 font-mono text-teal-400">${row.hours}</td>
                <td class="p-4 max-w-xs truncate">${escapeHtml(row.duties)}</td>
                <td class="p-4">
                    <div class="text-xs">${escapeHtml(row.supervisor_email)}</div>
                    <div class="text-[11px] text-slate-400 font-medium">${row.supervisor_name ? escapeHtml(row.supervisor_name) : 'Unsigned'}</div>
                    <div class="mt-1">${signatureActionHtml}</div>
                </td>
                <td class="p-4">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeClass}">${row.status}</span>
                </td>
                <td class="p-4 text-xs space-y-1">
                    <button id="edit-clinic-${row.id}" class="text-teal-400 hover:underline block">Edit Entry</button>
                    ${!isApproved ? `<button id="invite-clinic-${row.id}" class="text-slate-400 hover:underline text-[11px] block">Invite Supervisor Link</button>` : ''}
                </td>
            </tr>
        `;
        
        setTimeout(() => {
            document.getElementById(`edit-clinic-${row.id}`)?.addEventListener('click', () => {
                editClinicRow(row.id, row.start_date, row.end_date, row.hours, row.duties, row.supervisor_email);
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

// --- MUTATION HANDLING ENGINE ---
function editAnimalRow(id, name, startDate, endDate, hours, duties, contact) {
    document.getElementById('animal-modal-title').innerText = "Edit Animal Experience";
    document.getElementById('animal-edit-id').value = id;
    document.getElementById('anim-name').value = name;
    document.getElementById('anim-start-date').value = startDate;
    document.getElementById('anim-end-date').value = endDate || startDate;
    document.getElementById('anim-hours').value = hours;
    document.getElementById('anim-duties').value = duties;
    document.getElementById('anim-contact').value = contact;
    toggleModal('animal-modal', true);
}

document.getElementById('animal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('animal-edit-id').value;
    const payload = {
        user_id: currentUser.id,
        experience_name: document.getElementById('anim-name').value,
        start_date: document.getElementById('anim-start-date').value,
        end_date: document.getElementById('anim-end-date').value,
        hours: parseFloat(document.getElementById('anim-hours').value),
        duties: document.getElementById('anim-duties').value,
        contact_name: document.getElementById('anim-contact').value
    };
    
    let result;
    if (id) {
        result = await supabaseClient.from('animal_experience').update(payload).eq('id', id);
    } else {
        result = await supabaseClient.from('animal_experience').insert([payload]);
    }

    if (result.error) alert(result.error.message);
    else { 
        toggleModal('animal-modal', false); 
        document.getElementById('animal-form').reset(); 
        document.getElementById('animal-edit-id').value = '';
        loadData(); 
    }
});

function editClinicRow(id, startDate, endDate, hours, duties, email) {
    document.getElementById('clinic-modal-title').innerText = "Edit Clinical Veterinary Shift";
    document.getElementById('clinic-edit-id').value = id;
    document.getElementById('clin-start-date').value = startDate;
    document.getElementById('clin-end-date').value = endDate || startDate;
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
        start_date: document.getElementById('clin-start-date').value,
        end_date: document.getElementById('clin-end-date').value,
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
    const { data: animData } = await supabaseClient.from('animal_experience').select('*').order('start_date', { ascending: false });
    const { data: clinData } = await supabaseClient.from('clinic_experience').select('*').order('start_date', { ascending: false });

    const workbook = new exceljs.Workbook();
    
    // 1. Animal Experience Sheet
    const ws1 = workbook.addWorksheet('Animal Experience');
    ws1.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Start Date', key: 'start_date', width: 15 },
        { header: 'End Date', key: 'end_date', width: 15 },
        { header: 'Hours', key: 'hours', width: 12 },
        { header: 'Duties', key: 'duties', width: 40 },
        { header: 'Contact', key: 'contact', width: 30 }
    ];
    animData?.forEach(r => {
        ws1.addRow({ 
            name: r.experience_name, 
            start_date: r.start_date, 
            end_date: r.end_date || r.start_date, 
            hours: Number(r.hours), 
            duties: r.duties, 
            contact: r.contact_name 
        });
    });

    // 2. Clinic Experience Sheet
    const ws2 = workbook.addWorksheet('Clinic Experience');
    ws2.columns = [
        { header: 'Start Date', key: 'start_date', width: 15 },
        { header: 'End Date', key: 'end_date', width: 15 },
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
            const currentRowNum = i + 2; 
            
            ws2.addRow({
                start_date: r.start_date,
                end_date: r.end_date || r.start_date,
                hours: Number(r.hours),
                duties: r.duties,
                email: r.supervisor_email,
                s_name: r.supervisor_name || 'N/A',
                status: r.status,
                sig: r.signature_url ? '' : 'No Signature Logged'
            });

            if (r.signature_url && r.signature_url.startsWith('data:image')) {
                ws2.getRow(currentRowNum).height = 55;
                
                const imageId = workbook.addImage({
                    base64: r.signature_url,
                    extension: 'png',
                });
                
                ws2.addImage(imageId, {
                    tl: { col: 7, row: currentRowNum - 1 },
                    ext: { width: 150, height: 65 },
                    editAs: 'undefined'
                });
            }
        }
    }

    // Style headers
    [ws1, ws2].forEach(ws => {
        ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ws.getRow(1).eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
        ws.getRow(1).height = 25;
    });

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
