document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let state = {
        enabled: true,
        currentIndex: 0,
        profiles: [{ name: 'Default', user: '', pass: '', target: '*' }],
        logs: ["System Initialized."]
    };

    // --- DOM Elements ---
    const els = {
        btnOn: document.getElementById('btn-on'),
        btnOff: document.getElementById('btn-off'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        profileName: document.getElementById('profile-name'),
        targetDomain: document.getElementById('target-domain'),
        displayTarget: document.getElementById('display-target'),
        displayProfileName: document.getElementById('display-profile-name'),
        statusMsg: document.getElementById('status-message'),
        logContainer: document.getElementById('log-container')
    };

    // --- Initialization & Loading ---
    chrome.storage.local.get(['portalState'], (result) => {
        if (result.portalState) {
            // Merge saved state, preserving defaults if missing
            state = { ...state, ...result.portalState };
            if (!state.profiles || state.profiles.length === 0) {
                state.profiles = [{ name: 'Default', user: '', pass: '', target: '*' }];
            }
        }
        renderUI();
    });

    function saveState(message = 'Saved.') {
        chrome.storage.local.set({ portalState: state }, () => {
            showStatus(message);
            renderUI(); // Re-render to ensure UI matches state
        });
    }

    function showStatus(msg) {
        els.statusMsg.textContent = msg;
        setTimeout(() => { els.statusMsg.textContent = ''; }, 2000);
    }

    function logEvent(msg) {
        const time = new Date().toLocaleTimeString();
        state.logs.unshift(`[${time}] ${msg}`); // Add to top
        if (state.logs.length > 50) state.logs.pop(); // Keep max 50 logs
        saveState('Log updated');
    }

    // --- Core Rendering Function ---
    function renderUI() {
        // Toggle Buttons
        if (state.enabled) {
            els.btnOn.classList.add('active');
            els.btnOff.classList.remove('active');
        } else {
            els.btnOff.classList.add('active');
            els.btnOn.classList.remove('active');
        }

        // Current Profile Data
        const currentProfile = state.profiles[state.currentIndex];
        if (currentProfile) {
            els.username.value = currentProfile.user || '';
            els.password.value = currentProfile.pass || '';
            els.profileName.value = currentProfile.name || '';
            els.targetDomain.value = currentProfile.target || '';
            
            // Top display
            els.displayProfileName.textContent = currentProfile.name;
            els.displayTarget.textContent = currentProfile.target === '*' ? 'Any Portal' : currentProfile.target;
        }

        // Logs
        els.logContainer.innerHTML = state.logs.map(l => `<div>${l}</div>`).join('');
   
        // Inside your renderUI() function:
        document.getElementById('use-raw').checked = currentProfile.useRaw || false;
        document.getElementById('raw-fields').style.display = currentProfile.useRaw ? 'block' : 'none';
        document.getElementById('raw-method').value = currentProfile.rawMethod || 'POST';
        document.getElementById('raw-url').value = currentProfile.rawUrl || '';
        document.getElementById('raw-payload').value = currentProfile.rawPayload || '';

        // Add event listener for the checkbox toggle
        document.getElementById('use-raw').addEventListener('change', (e) => {
            state.profiles[state.currentIndex].useRaw = e.target.checked;
            renderUI();
            saveState();
        });

        // Update your save-btn listener to capture the new fields
        currentProfile.rawMethod = document.getElementById('raw-method').value;
        currentProfile.rawUrl = document.getElementById('raw-url').value;
        currentProfile.rawPayload = document.getElementById('raw-payload').value;

    }

    // --- Event Listeners ---

    // 1. Master Toggle
    els.btnOn.addEventListener('click', () => { state.enabled = true; saveState('Extension Enabled'); });
    els.btnOff.addEventListener('click', () => { state.enabled = false; saveState('Extension Disabled'); });

    // 2. Tab Switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.pane').forEach(p => p.classList.remove('active-pane'));
            
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active-pane');
        });
    });

    // 3. Profile Cycling (Arrow Keys)
    document.querySelectorAll('.prev-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.profiles.length > 0) {
                state.currentIndex = (state.currentIndex - 1 + state.profiles.length) % state.profiles.length;
                renderUI();
            }
        });
    });
    
    document.querySelectorAll('.next-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.profiles.length > 0) {
                state.currentIndex = (state.currentIndex + 1) % state.profiles.length;
                renderUI();
            }
        });
    });

    // 4. Saving Data
    document.getElementById('save-btn').addEventListener('click', () => {
        const currentProfile = state.profiles[state.currentIndex];
        currentProfile.user = els.username.value;
        currentProfile.pass = els.password.value;
        currentProfile.name = els.profileName.value;
        currentProfile.target = els.targetDomain.value;
        logEvent(`Updated profile: ${currentProfile.name}`);
        saveState(`Profile ${state.currentIndex + 1}/${state.profiles.length} Saved!`);
    });

    // Handle saving from the Network tab text fields as they type
    els.profileName.addEventListener('change', () => { state.profiles[state.currentIndex].name = els.profileName.value; saveState(''); });
    els.targetDomain.addEventListener('change', () => { state.profiles[state.currentIndex].target = els.targetDomain.value; saveState(''); });

    // 5. Creating New Profiles
    document.getElementById('add-new-profile-btn').addEventListener('click', () => {
        state.profiles.push({ name: `Profile ${state.profiles.length + 1}`, user: '', pass: '', target: '*' });
        state.currentIndex = state.profiles.length - 1; // Jump to the new profile
        logEvent('Created new blank profile.');
        saveState('New profile created.');
    });

//  Delete Profile Logic
    document.getElementById('delete-profile-btn').addEventListener('click', () => {
        const deletedName = state.profiles[state.currentIndex].name;
        
        // Remove the profile at the current index
        state.profiles.splice(state.currentIndex, 1);
        
        // Failsafe: If they deleted the last profile, create a blank default
        if (state.profiles.length === 0) {
            state.profiles.push({ name: 'Default', user: '', pass: '', target: '*' });
        }
        
        // Adjust index if we deleted the profile at the very end of the array
        if (state.currentIndex >= state.profiles.length) {
            state.currentIndex = Math.max(0, state.profiles.length - 1);
        }
        
        logEvent(`Deleted profile: ${deletedName}`);
        saveState(`Profile '${deletedName}' deleted.`);
    });

    // 6. Log Management
    document.getElementById('clear-logs-btn').addEventListener('click', () => {
        state.logs = ["Logs cleared."];
        saveState('Logs cleared.');
    });

    // 7. Footer Buttons
    document.getElementById('help-btn').addEventListener('click', () => {
        // Opens the local help.html file in a new browser tab
        chrome.tabs.create({ url: chrome.runtime.getURL("help.html") });
    });
    document.getElementById('status-btn').addEventListener('click', () => {
        showStatus(`Status: ${state.enabled ? 'Listening on port 80/443' : 'Sleeping'}`);
    });
});
