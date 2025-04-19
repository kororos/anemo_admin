<template>
  <q-table
    :rows="devices" 
    :columns="columns" 
    row-key="id" 
    @row-click="onRowClick"
    :pagination="initialPagination"
    :rows-per-page-options="[0, 5, 10, 20, 50]"
    binary-state-sort
    :loading="isLoading"
  >
    <template v-slot:loading>
      <q-inner-loading showing>
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </template>
    <template v-slot:body-cell-status="props">
      <q-td :props="props">
        <q-chip :label="props.row.status" outline :color="props.row.status === 'Online' ? 'positive' : 'negative'" text-color="white" />
      </q-td>
    </template>
    <template v-slot:body-cell-lastConnection="props">
      <q-td :props="props">
        {{ formatDateTime(props.row.lastConnection) }}
      </q-td>
    </template>
    <template v-slot:body-cell-arcStart="props">
      <q-td :props="props" @click.stop>
        <q-input
          v-model.number="editedRow.arcStart"
          dense
          type="number"
          min="0"
          max="360"
          style="width: 70px"
          @click.stop
          v-if="props.row.id === editingRowId"
        />
        <span v-else>{{ props.row.arcStart }}</span>
      </q-td>
    </template>
    <template v-slot:body-cell-arcEnd="props">
      <q-td :props="props" @click.stop>
        <q-input
          v-model.number="editedRow.arcEnd"
          dense
          type="number"
          min="0"
          max="360"
          style="width: 70px"
          @click.stop
          v-if="props.row.id === editingRowId"
        />
        <span v-else>{{ props.row.arcEnd }}</span>
      </q-td>
    </template>
    <template v-slot:body-cell-actions="props">
      <q-td :props="props" @click.stop>
        <div v-if="props.row.id === editingRowId">
          <q-btn 
            :flat="isValidArc"
            dense
            :color="isValidArc ? 'positive' : 'grey-6'"
            icon="save"
            @click="saveChanges(props.row)"
            :disable="!isValidArc"
          >
            <q-tooltip v-if="!isValidArc">
              {{ validationErrorMessage }}
            </q-tooltip>
            <q-tooltip v-else>
              Save changes
            </q-tooltip>
          </q-btn>
          <q-btn 
            flat
            dense
            color="negative"
            icon="cancel"
            @click="discardChanges()"
          >
            <q-tooltip>
              Discard changes
            </q-tooltip>
          </q-btn>
        </div>
        <div v-else>
          <q-btn 
            flat
            dense
            color="primary"
            icon="edit"
            @click="startEditing(props.row)"
            title="Edit arc settings"
          />
        </div>
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDevicesStore } from "src/stores/devicesStore";
import { useWebSocketStore } from "src/stores/webSocketStore";
import { useQuasar } from 'quasar';

const devicesStore = useDevicesStore();
const webSocketStore = useWebSocketStore();
const $q = useQuasar();
const emit = defineEmits(['device-selected']);

// Reactive state
const editingRowId = ref(null);
const editedRow = ref({
  arcStart: null,
  arcEnd: null
});

// Computed properties
const devices = computed(() => {
  // Add status information to each device
  return devicesStore.devices.map(device => {
    const isOnline = webSocketStore.clients.some(client => client.mac === device.macAddress);
    return {
      ...device,
      status: isOnline ? 'Online' : 'Offline'
    };
  });
});

const isLoading = computed(() => devicesStore.isLoading);

// Pagination settings
const initialPagination = {
  sortBy: 'clientId',
  descending: false,
  page: 1,
  rowsPerPage: 0 // 0 means show all rows
};

// Format date for the Last Seen column
const formatDateTime = (dateString) => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  
  // Format: dd-mm-yy hh:mm:ss
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

// Define columns with action column
const columns = [
  {
    name: "clientId",
    required: true,
    label: "Client ID",
    align: "left",
    field: "clientId",
    sortable: true,
  },
  {
    name: "macAddress",
    required: true,
    label: "MAC Address",
    align: "left",
    field: "macAddress",
    sortable: true,
  },
  {
    name: "hwVersion",
    required: true,
    label: "Hardware Version",
    align: "left",
    field: "hwVersion",
    sortable: true,
  },
  {
    name: "fwVersion",
    required: true,
    label: "Firmware Version",
    align: "left",
    field: "fwVersion",
    sortable: true,
  },
  {
    name: "lastConnection",
    required: true,
    label: "Last Seen",
    align: "left",
    field: "lastConnection",
    sortable: true,
  },
  {
    name: "arcStart",
    label: "Arc Start (°)",
    field: "arcStart",
    required: true,
    align: "left",
    sortable: true,
  },
  {
    name: "arcEnd",
    label: "Arc End (°)",
    field: "arcEnd",
    required: true,
    align: "left",
    sortable: true,
  },
  {
    name: "status",
    label: "Status",
    field: "status",
    required: true,
    align: "left",
  },
  {
    name: "actions",
    label: "Actions",
    field: "actions",
    align: "center",
  }
];

// Handle row click (device selection)
const onRowClick = (evt, row) => {
  // Only emit if we're not in edit mode
  if (editingRowId.value === null) {
    emit('device-selected', row.clientId);
  }
};

// Start editing a row
const startEditing = (row) => {
  // If already editing this row, do nothing
  if (editingRowId.value === row.id) return;
  
  // If editing another row, discard changes first
  if (editingRowId.value !== null) {
    discardChanges();
  }
  
  // Set editing state
  editingRowId.value = row.id;
  editedRow.value = {
    arcStart: row.arcStart,
    arcEnd: row.arcEnd
  };
};

// Validation
const isValidArc = computed(() => {
  const start = editedRow.value.arcStart === null || editedRow.value.arcStart === '' ? null : Number(editedRow.value.arcStart);
  const end = editedRow.value.arcEnd === null || editedRow.value.arcEnd === '' ? null : Number(editedRow.value.arcEnd);
  
  // Basic validation
  if (start !== null && (isNaN(start) || start < 0 || start > 360)) {
    return false;
  }
  
  if (end !== null && (isNaN(end) || end < 0 || end > 360)) {
    return false;
  }
  
  // Arc end must be greater than arc start (if both are provided)
  if (start !== null && end !== null && start >= end) {
    return false;
  }
  
  return true;
});

// Get specific validation error message for tooltip
const validationErrorMessage = computed(() => {
  const start = editedRow.value.arcStart === null || editedRow.value.arcStart === '' ? null : Number(editedRow.value.arcStart);
  const end = editedRow.value.arcEnd === null || editedRow.value.arcEnd === '' ? null : Number(editedRow.value.arcEnd);
  
  if (start !== null && (isNaN(start) || start < 0 || start > 360)) {
    return 'Arc Start must be between 0 and 360 degrees';
  }
  
  if (end !== null && (isNaN(end) || end < 0 || end > 360)) {
    return 'Arc End must be between 0 and 360 degrees';
  }
  
  if (start !== null && end !== null && start >= end) {
    return 'Arc End must be greater than Arc Start';
  }
  
  return 'Invalid values';
});

// Save changes to the database
const saveChanges = async (row) => {
  if (!isValidArc.value) return;
  
  try {
    // Use the store action to update the device
    await devicesStore.updateDeviceArc(
      row.id,
      editedRow.value.arcStart === '' ? null : Number(editedRow.value.arcStart),
      editedRow.value.arcEnd === '' ? null : Number(editedRow.value.arcEnd)
    );
    
    // Show success message
    $q.notify({
      color: 'positive',
      message: 'Arc settings updated successfully',
      icon: 'check'
    });
    
    // Reset editing state
    editingRowId.value = null;
    editedRow.value = { arcStart: null, arcEnd: null };
  } catch (error) {
    console.error('Failed to update arc settings:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to update arc settings: ' + (error.response?.data?.message || error.message),
      icon: 'error'
    });
  }
};

// Discard changes and revert to original values
const discardChanges = () => {
  editingRowId.value = null;
  editedRow.value = { arcStart: null, arcEnd: null };
};

// No need to manually fetch devices on mount - the store handles this
</script>