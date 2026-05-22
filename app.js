// 1. UPDATE LOAD DATA
async function loadData() {
    if (!currentUser) return;
    const { data: animals } = await supabaseClient.from('animal_experience').select('*').order('date', { ascending: false });
    const animalBody = document.getElementById('animal-table-body');
    animalBody.innerHTML = '';
    animals?.forEach(row => {
        animalBody.innerHTML += `
            <tr class="hover:bg-slate-750 transition">
                <td class="p-4 text-slate-200">${escapeHtml(row.experience_name)}</td>
                <td class="p-4">${row.date}</td>
                <td class="p-4 text-teal-400">${escapeHtml(row.animals_worked_with || 'N/A')}</td>
                <td class="p-4">${row.hours}</td>
                <td class="p-4 text-slate-400 truncate max-w-[150px]">${escapeHtml(row.duties)}</td>
                <td class="p-4 text-slate-400">${escapeHtml(row.contact_name)}</td>
            </tr>
        `;
    });
    // ... (keep your existing clinic_experience logic below this)
}

// 2. UPDATE FORM SUBMISSION
document.getElementById('animal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        user_id: currentUser.id,
        experience_name: document.getElementById('anim-name').value,
        date: document.getElementById('anim-date').value,
        hours: parseFloat(document.getElementById('anim-hours').value),
        animals_worked_with: document.getElementById('anim-species').value, // New
        duties: document.getElementById('anim-duties').value,
        contact_name: document.getElementById('anim-contact').value
    };
    const { error } = await supabaseClient.from('animal_experience').insert([payload]);
    if (error) alert(error.message);
    else { toggleModal('animal-modal', false); document.getElementById('animal-form').reset(); loadData(); }
});

// 3. UPDATE EXCEL EXPORT
// In the '1. Add Animal Experience Sheet' section inside the export-btn listener:
ws1.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Species', key: 'species', width: 20 }, // New
    { header: 'Hours', key: 'hours', width: 12 },
    { header: 'Duties', key: 'duties', width: 40 },
    { header: 'Contact', key: 'contact', width: 30 }
];
animData?.forEach(r => {
    ws1.addRow({ 
        name: r.experience_name, 
        date: r.date, 
        species: r.animals_worked_with, // New
        hours: Number(r.hours), 
        duties: r.duties, 
        contact: r.contact_name 
    });
});
