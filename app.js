// --- UPDATED DATA ACCESS OPERATIONS ---
async function loadData() {
    if (!currentUser) return;
    
    // Load Animals
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
    clinics?.forEach(row => {
        const isApproved = row.status === 'Approved';
        const badgeClass = isApproved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        
        let signatureActionHtml = '<span class="text-slate-500 italic">Unsigned</span>';
        if (isApproved && row.signature_url) {
            signatureActionHtml = `<button id="view-sig-${row.id}" class="text-teal-400 hover:underline flex items-center">👁️ View Signature</button>`;
        }

        clinicBody.innerHTML += `
            <tr class="hover:bg-slate-750 transition">
                <td class="p-4">${row.date}</td>
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
                    <button id="edit-clinic-${row.id}" class="text-teal-400 hover:underline block">Edit</button>
                    ${!isApproved ? `<button id="invite-clinic-${row.id}" class="text-slate-400 hover:underline text-[11px] block">Invite</button>` : ''}
                    <button id="del-clin-${row.id}" class="text-rose-400 hover:underline block">Delete</button>
                </td>
            </tr>
        `;
        
        setTimeout(() => {
            document.getElementById(`edit-clinic-${row.id}`)?.addEventListener('click', () => editClinicRow(row.id, row.date, row.hours, row.duties, row.supervisor_email));
            document.getElementById(`del-clin-${row.id}`)?.addEventListener('click', () => deleteRecord('clinic_experience', row.id));
            // ... (keep the rest of your existing logic for view-sig and invite buttons)
        }, 0);
    });
}

// --- NEW HELPER FUNCTION ---
async function deleteRecord(table, id) {
    if (confirm('Are you sure you want to permanently delete this entry?')) {
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) alert(error.message);
        else loadData();
    }
}
