// --- CONFIGURATION MANAGEMENT ---
const SUPABASE_URL = "https://dmddmjnefyaviibpqtod.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZGRtam5lZnlhdmlpYnBxdG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDQxODksImV4cCI6MjA5NDg4MDE4OX0.ZcdboqU-DC_UQxXwPoF5W35BddEN1ghxMmVQLe_5iNU";

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Extract the shift ID parameter directly out of the URL string (?id=X)
const urlParams = new URLSearchParams(window.location.search);
const recordId = urlParams.get('id');

// Elements
const displayDate = document.getElementById('display-date');
const displayHours = document.getElementById('display-hours');
const displayDuties = document.getElementById('display-duties');
const verifyForm = document.getElementById('verify-form');
const successMessage = document.getElementById('success-message');

// Initialize Signature Pad Canvas
const canvas = document.getElementById('signature-canvas');
let signaturePad = null;

function resizeCanvas() {
    // Basic canvas adjustment to map responsive device widths correctly
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    if (signaturePad) signaturePad.clear();
}

// Kickoff operations
if (!recordId) {
    alert("Error: Missing verification record token ID. Please ask the candidate to send you a valid verification link.");
} else {
    // Run canvas scaling
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    // Fire up SignaturePad engine
    signaturePad = new SignaturePad(canvas, {
        penColor: "rgb(15, 23, 42)" // Dark navy ink color matching slate layout
    });

    // Load entry statistics from database
    loadRecordDetails();
}

async function loadRecordDetails() {
    const { data, error } = await supabaseClient
        .from('clinic_experience')
        .select('*')
        .eq('id', recordId)
        .single();

    if (error || !data) {
        alert("Error retrieving log data: Record might have been modified or deleted.");
        return;
    }

    // Populate display text values dynamically
    displayDate.textContent = data.date;
    displayHours.textContent = data.hours + " Hours";
    displayDuties.textContent = data.duties;

    // Guard rail: Check if shift was already signed off
    if (data.status === 'Approved') {
        verifyForm.classList.add('hidden');
        successMessage.classList.remove('hidden');
    }
}

// Clear signature button listener
document.getElementById('clear-btn').addEventListener('click', () => signaturePad.clear());

// Handle verification form submission
verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (signaturePad.isEmpty()) {
        alert("Please provide an authorization signature on the touchpad before submitting approval.");
        return;
    }

    // Convert signature drawing canvas strictly to an image string base64 data URL
    const signatureDataUrl = canvas.toDataURL();
    const supervisorNameValue = document.getElementById('supervisor-name').value;

    // Mutate database record to update verification checkpoint state
    const { error } = await supabaseClient
        .from('clinic_experience')
        .update({
            status: 'Approved',
            supervisor_name: supervisorNameValue,
            signature_url: signatureDataUrl
        })
        .eq('id', recordId);

    if (error) {
        alert("Error saving approval state: " + error.message);
    } else {
        // Swap visibility state views
        verifyForm.classList.add('hidden');
        successMessage.classList.remove('hidden');
    }
});
