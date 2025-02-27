let providers = {};
let encryptionKey = localStorage.getItem('encryptionKey');
if (!encryptionKey) {
    encryptionKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
    localStorage.setItem('encryptionKey', encryptionKey);
}

const integrationTypeSelect = document.getElementById('integration-type');
const integrationFieldsDiv = document.getElementById('integration-fields');
const addIntegrationButton = document.getElementById('add-integration');
const activeIntegrationsDiv = document.getElementById('active-integrations');
const localStorageOnlyCheckbox = document.getElementById('local-storage-only');
const saveSettingsButton = document.getElementById('save-api-settings');
const closeModalButton = document.getElementById('close-modal');
const modal = document.getElementById('api-settings-modal');
let editor; // CodeMirror editor instance

// Custom alert function
function showCustomAlert(message) {
    document.getElementById('alert-message').textContent = message;
    const buttonsDiv = document.getElementById('alert-buttons');
    buttonsDiv.innerHTML = '<button id="alert-ok">OK</button>';
    document.getElementById('custom-alert-modal').style.display = 'flex';
    document.getElementById('alert-ok').addEventListener('click', function() {
        document.getElementById('custom-alert-modal').style.display = 'none';
    });
}

// Custom confirm function
function showCustomConfirm(message, onConfirm) {
    document.getElementById('alert-message').textContent = message;
    const buttonsDiv = document.getElementById('alert-buttons');
    buttonsDiv.innerHTML = '<button id="alert-yes" class="confirm-yes">Yes</button><button id="alert-no" class="confirm-no">No</button>';
    document.getElementById('custom-alert-modal').style.display = 'flex';
    document.getElementById('alert-yes').addEventListener('click', function() {
        document.getElementById('custom-alert-modal').style.display = 'none';
        onConfirm();
    });
    document.getElementById('alert-no').addEventListener('click', function() {
        document.getElementById('custom-alert-modal').style.display = 'none';
    });
}

// Close alert modal when clicking outside
document.getElementById('custom-alert-modal').addEventListener('click', function(event) {
    if (event.target === this) {
        this.style.display = 'none';
    }
});

function encrypt(value) {
    return CryptoJS.AES.encrypt(value, encryptionKey).toString();
}

function decrypt(encryptedValue) {
    try {
        return CryptoJS.AES.decrypt(encryptedValue, encryptionKey).toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.error('Decryption error:', e);
        return '';
    }
}

function openSettingsModal() {
    modal.style.display = 'block';
    fetch('providers.json')
        .then(response => response.json())
        .then(data => {
            providers = data;
            const defaultOption = integrationTypeSelect.options[0];
            integrationTypeSelect.innerHTML = '';
            integrationTypeSelect.appendChild(defaultOption);
            Object.keys(providers).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = providers[key].display_name;
                integrationTypeSelect.appendChild(option);
            });
            loadActiveIntegrations();
            loadPrivacySettings();
        })
        .catch(error => {
            console.error('Error loading providers:', error);
            showCustomAlert('Failed to load provider configurations.');
        });
}

function handleTypeChange() {
    const type = integrationTypeSelect.value;
    integrationFieldsDiv.innerHTML = '';
    if (type && providers[type]) {
        providers[type].fields.forEach(field => {
            const label = document.createElement('label');
            label.textContent = field.label;
            label.style.display = 'block';
            label.style.marginBottom = '5px';
            label.style.color = '#aaffaa';
            const input = document.createElement('input');
            input.type = field.type;
            input.name = field.name;
            input.style.width = '100%';
            input.style.padding = '8px';
            input.style.backgroundColor = '#2a3a2a';
            input.style.color = '#aaffaa';
            input.style.border = '1px solid #4a5a4a';
            input.style.borderRadius = '4px';
            integrationFieldsDiv.appendChild(label);
            integrationFieldsDiv.appendChild(input);
        });
    }
}

function handleAddIntegration() {
    const name = document.getElementById('integration-name').value;
    const type = integrationTypeSelect.value;
    if (!name || !type) {
        showCustomAlert('Please provide a name and select a type.');
        return;
    }
    const integration = { name, type };
    const fields = providers[type].fields;
    fields.forEach(field => {
        const input = integrationFieldsDiv.querySelector(`input[name="${field.name}"]`);
        let value = input.value;
        if (field.sensitive) {
            value = encrypt(value);
        }
        integration[field.name] = value;
    });
    let integrations = JSON.parse(localStorage.getItem('integrations') || '[]');
    integrations.push(integration);
    localStorage.setItem('integrations', JSON.stringify(integrations));
    document.getElementById('integration-name').value = '';
    integrationTypeSelect.value = '';
    integrationFieldsDiv.innerHTML = '';
    loadActiveIntegrations();
}

function loadActiveIntegrations() {
    const integrations = JSON.parse(localStorage.getItem('integrations') || '[]');
    activeIntegrationsDiv.innerHTML = '';
    integrations.forEach((integration, index) => {
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        const nameSpan = document.createElement('span');
        nameSpan.style.color = '#aaffaa';
        nameSpan.textContent = `${integration.name} (${integration.type})`;
        div.appendChild(nameSpan);
        const viewEditButton = document.createElement('button');
        viewEditButton.className = 'view-edit-integration';
        viewEditButton.setAttribute('data-index', index);
        viewEditButton.style.marginLeft = '10px';
        viewEditButton.style.background = 'none';
        viewEditButton.style.border = 'none';
        viewEditButton.style.color = '#aaffaa';
        viewEditButton.style.cursor = 'pointer';
        viewEditButton.textContent = 'View/Edit';
        div.appendChild(viewEditButton);
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-integration';
        removeButton.setAttribute('data-index', index);
        removeButton.style.marginLeft = '10px';
        removeButton.style.background = 'none';
        removeButton.style.border = 'none';
        removeButton.style.color = '#ff4444';
        removeButton.style.cursor = 'pointer';
        removeButton.textContent = 'Remove';
        div.appendChild(removeButton);
        activeIntegrationsDiv.appendChild(div);
    });
    document.querySelectorAll('.view-edit-integration').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            showIntegrationDetails(index);
        });
    });
    document.querySelectorAll('.remove-integration').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            integrations.splice(index, 1);
            localStorage.setItem('integrations', JSON.stringify(integrations));
            loadActiveIntegrations();
        });
    });
}

function showIntegrationDetails(index) {
    const integrations = JSON.parse(localStorage.getItem('integrations') || '[]');
    const integration = integrations[index];
    const decryptedIntegration = { ...integration };
    providers[integration.type].fields.forEach(field => {
        if (field.sensitive) {
            decryptedIntegration[field.name] = decrypt(integration[field.name]);
        }
    });
    document.getElementById('integration-details-modal').style.display = 'flex';
    if (!editor) {
        editor = CodeMirror(document.getElementById('integration-editor'), {
            mode: 'application/json',
            theme: 'default',
            lineNumbers: true,
            value: JSON.stringify(decryptedIntegration, null, 2)
        });
    } else {
        editor.setValue(JSON.stringify(decryptedIntegration, null, 2));
    }
    document.getElementById('save-integration-changes').onclick = function() {
        saveIntegrationChanges(index);
    };
    document.getElementById('close-integration-modal').onclick = function() {
        document.getElementById('integration-details-modal').style.display = 'none';
    };
}

function saveIntegrationChanges(index) {
    try {
        const updatedIntegration = JSON.parse(editor.getValue());
        const integrations = JSON.parse(localStorage.getItem('integrations') || '[]');
        const originalIntegration = integrations[index];
        providers[originalIntegration.type].fields.forEach(field => {
            if (field.sensitive) {
                updatedIntegration[field.name] = encrypt(updatedIntegration[field.name]);
            }
        });
        integrations[index] = updatedIntegration;
        localStorage.setItem('integrations', JSON.stringify(integrations));
        document.getElementById('integration-details-modal').style.display = 'none';
        loadActiveIntegrations();
    } catch (e) {
        showCustomAlert('Invalid JSON. Please correct the errors and try again.');
    }
}

function loadPrivacySettings() {
    const localStorageOnly = localStorage.getItem('localStorageOnly') === 'true';
    localStorageOnlyCheckbox.checked = localStorageOnly;
    document.getElementById('clear-on-exit').checked = localStorage.getItem('clearOnExit') === 'true';
    document.getElementById('disable-analytics').checked = localStorage.getItem('disableAnalytics') === 'true';
}

saveSettingsButton.addEventListener('click', function() {
    localStorage.setItem('localStorageOnly', localStorageOnlyCheckbox.checked);
    localStorage.setItem('clearOnExit', document.getElementById('clear-on-exit').checked);
    localStorage.setItem('disableAnalytics', document.getElementById('disable-analytics').checked);
    showCustomAlert('Settings saved.');
    modal.style.display = 'none';
});

closeModalButton.addEventListener('click', function() {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

const tabs = document.querySelectorAll('.settings-tab');
const contents = {
    integrations: document.getElementById('integrations-settings-tab'),
    privacy: document.getElementById('privacy-settings-tab'),
    account: document.getElementById('account-settings-tab')
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Object.values(contents).forEach(content => {
            content.style.display = 'none';
        });
        const currentTab = tab.getAttribute('data-tab');
        contents[currentTab].style.display = 'block';
    });
});

document.getElementById('clear-all-data').addEventListener('click', function() {
    showCustomConfirm('Are you sure you want to clear all local data? This action cannot be undone.', function() {
        localStorage.clear();
        loadActiveIntegrations();
        loadPrivacySettings();
        showCustomAlert('All local data has been cleared.');
    });
});

document.getElementById('export-data').addEventListener('click', function() {
    const rawIntegrations = JSON.parse(localStorage.getItem('integrations') || '[]');
    const decryptedIntegrations = rawIntegrations.map(integration => {
        const decryptedIntegration = { ...integration };
        if (providers[integration.type] && providers[integration.type].fields) {
            providers[integration.type].fields.forEach(field => {
                if (field.sensitive && decryptedIntegration[field.name]) {
                    decryptedIntegration[field.name] = decrypt(decryptedIntegration[field.name]);
                }
            });
        }
        return decryptedIntegration;
    });
    const data = {
        integrations: decryptedIntegrations,
        settings: {
            localStorageOnly: localStorage.getItem('localStorageOnly'),
            clearOnExit: localStorage.getItem('clearOnExit'),
            disableAnalytics: localStorage.getItem('disableAnalytics')
        }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings-export.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('settings-button').addEventListener('click', openSettingsModal);

integrationTypeSelect.addEventListener('change', handleTypeChange);
addIntegrationButton.addEventListener('click', handleAddIntegration);