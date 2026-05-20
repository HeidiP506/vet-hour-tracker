// --- CONFIGURATION MANAGEMENT ---
const SUPABASE_URL = "https://dmddmjnefyaviibpqtod.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZGRtam5lZnlhdmlpYnBxdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDQxODksImV4cCI6MjA5NDg4MDE4OX0.ZcdboqU-DC_UQxXwPoF5W35BddEN1ghxMmVQLe_5iNU";

// Direct module import ensures the library is fully loaded before initialization
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// --- VIEW ROUTING ENGINE ---
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const pageAnimal = document.getElementById('page-animal');
const pageClinic = document.getElementById('page-clinic');

// Tab switching listeners
document.getElementById('nav-animal').addEventListener('click', () => switchTab('animal'));
document.getElementById('nav-clinic').addEventListener('click', () => switchTab('clinic'));

// Explicit modal event listeners to bypass module scope restrictions
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
    
    const { data: animals } = await supabaseClient.from('animal_experience').select('*').order('date', { ascending: false });
    const animalBody = document.getElementById('animal-table-body');
    animalBody.innerHTML = '';
    animals?.forEach(row => {
        animalBody.innerHTML += `
            <tr class="hover:bg-slate-750 transition">
                <td class="p-4 font-semibold text-slate-200">${escapeHtml(row.experience_name)}</td>
                <td class="p-4">${row.date}</td>
                <td class="p-4 font-mono text-teal-400">${row.hours}</td>
                <td class="p-4 max-w-xs truncate">${escapeHtml(row.duties)}</td>
                <td class="p-4 text-slate-400">${escapeHtml(row.contact_name)}</td>
            </tr>
        `;
    });

    const { data: clinics } = await supabaseClient.from('clinic_experience').select('*').order('date', { ascending: false });
    const clinicBody = document.getElementById('clinic-table-body');
    clinicBody.innerHTML = '';
    clinics?.forEach(row => {
        const isApproved = row.status === 'Approved';
        const badgeClass = isApproved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        
        clinicBody.innerHTML += `
            <tr class="hover:bg-slate-750 transition">
                <td class="p-4">${row.date}</td>
                <td class="p-4 font-mono text-teal-400">${row.hours}</td>
                <td class="p-4 max-w-xs truncate">${escapeHtml(row.duties)}</td>
                <td class="p-4">
                    <div class="text-xs">${escapeHtml(row.supervisor_email)}</div>
                    <div class="text-[11px] text-slate-500">${row.supervisor_name ? escapeHtml(row.supervisor_name) : 'Unsigned'}</div>
                </td>
                <td class="p-4">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeClass}">${row.status}</span>
                </td>
                <td class="p-4 text-xs">
                    <button id="edit-clinic-${row.id}" class="text-teal-400 hover:underline">Edit Entry</button>
                    ${!isApproved ? `<br><button id="invite-clinic-${row.id}" class="text-slate-400 hover:underline text-[11px]">Invite Supervisor Link</button>` : ''}
                </td>
            </tr>
        `;
        
        // Add dynamic module-safe event listeners to table row actions
        setTimeout(() => {
            document.getElementById(`edit-clinic-${row.id}`)?.addEventListener('click', () => {
                editClinicRow(row.id, row.date, row.hours, row.duties, row.supervisor_email);
            });
            if (!isApproved) {
                document.getElementById(`invite-clinic-${row.id}`)?.addEventListener('click', () => {
                    const url = window.location.origin + '/verify.html?id=' + row.id;
                    navigator.clipboard.writeText(url).then(() => {
                        alert('Verification link copied to clipboard automatically! You can now just paste it (Ctrl+V or Cmd+V) into an email to your supervisor.');
                    }).catch(err => {
                        // Fallback case if clipboard permissions are blocked by browser settings
                        alert('Could not copy automatically. Link is:\n\n' + url);
                    });
                });
            }
        }, 0);
    });
}

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

// --- MULTI-TAB EXCEL GENERATOR WITH SIGNATURE STRINGS ---
document.getElementById('export-btn').addEventListener('click', async () => {
    const { data: animData } = await supabaseClient.from('animal_experience').select('*');
    const { data: clinData } = await supabaseClient.from('clinic_experience').select('*');

    let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:search" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
        <Worksheet ss:Name="Animal Experience">
            <Table>
                <Row><Cell><Data ss:Type="String">Name</Data></Cell><Cell><Data ss:Type="String">Date</Data></Cell><Cell><Data ss:Type="String">Hours</Data></Cell><Cell><Data ss:Type="String">Duties</Data></Cell><Cell><Data ss:Type="String">Contact</Data></Cell></Row>`;
    animData?.forEach(r => {
        xml += `<Row><Cell><Data ss:Type="String">${escapeHtml(r.experience_name)}</Data></Cell><Cell><Data ss:Type="String">${r.date}</Data></Cell><Cell><Data ss:Type="Number">${r.hours}</Data></Cell><Cell><Data ss:Type="String">${escapeHtml(r.duties)}</Data></Cell><Cell><Data ss:Type="String">${escapeHtml(r.contact_name)}</Data></Cell></Row>`;
    });
    xml += `</Table></Worksheet>
        <Worksheet ss:Name="Clinic Experience">
            <Table>
                <Row><Cell><Data ss:Type="String">Date</Data></Cell><Cell><Data ss:Type="String">Hours</Data></Cell><Cell><Data ss:Type="String">Duties</Data></Cell><Cell><Data ss:Type="String">Supervisor Email</Data></Cell><Cell><Data ss:Type="String">Supervisor Name</Data></Cell><Cell><Data ss:Type="String">Status</Data></Cell><Cell><Data ss:Type="String">Supervisor Signature Data</Data></Cell></Row>`;
    clinData?.forEach(r => {
        xml += `<Row><Cell><Data ss:Type="String">${r.date}</Data></Cell><Cell><Data ss:Type="Number">${r.hours}</Data></Cell><Cell><Data ss:Type="String">${escapeHtml(r.duties)}</Data></Cell><Cell><Data ss:Type="String">${escapeHtml(r.supervisor_email)}</Data></Cell><Cell><Data ss:Type="String">${r.supervisor_name ? escapeHtml(r.supervisor_name) : 'N/A'}</Data></Cell><Cell><Data ss:Type="String">${r.status}</Data></Cell><Cell><Data ss:Type="String">${r.signature_url ? r.signature_url : 'No Signature Logged'}</Data></Cell></Row>`;
    });
    xml += `</Table></Worksheet></Workbook>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "VetTrack_Milestones_Backup.xls";
    a.click();
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
