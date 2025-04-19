import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { useWebSocketStore } from './webSocketStore';

export const useDevicesStore = defineStore('devices', {
  state: () => ({
    devices: [],
    isLoading: false,
    lastUpdated: null,
  }),
  
  getters: {
    getDeviceById: (state) => (idOrMac) => {
      return state.devices.find(device => 
        device.clientId === idOrMac || 
        device.macAddress === idOrMac
      );
    },
    getDeviceByMac: (state) => (mac) => {
      return state.devices.find(device => device.macAddress === mac);
    },
    getArcSettings: (state) => (idOrMac) => {
      if (!idOrMac) {
        console.log('getArcSettings: No ID or MAC provided, using default values');
        return {
          arcStart: 0,
          arcEnd: 180
        };
      }
      
      // First try to find by MAC address as it's more reliable
      let device = state.devices.find(device => device.macAddress === idOrMac);
      
      // If not found by MAC, try by clientId
      if (!device) {
        device = state.devices.find(device => device.clientId === idOrMac);
      }
      
      if (!device) {
        console.log(`getArcSettings: Device not found for identifier "${idOrMac}", using default values`);
        return {
          arcStart: 0,
          arcEnd: 180
        };
      }
      
      console.log(`getArcSettings: Found device for "${idOrMac}", arc values: ${device.arcStart}-${device.arcEnd}`);
      return {
        arcStart: device?.arcStart ?? 0,
        arcEnd: device?.arcEnd ?? 180
      };
    }
  },
  
  actions: {
    async fetchDevices() {
      try {
        this.isLoading = true;
        console.log('DevicesStore: Fetching devices');
        const response = await api.get('/api/getKnownDevices');
        
        // Log the devices and their arc settings
        console.log('DevicesStore: Devices fetched successfully:', response.data.length);
        response.data.forEach(device => {
          console.log(`Device ${device.clientId} (${device.macAddress}): arcStart=${device.arcStart}, arcEnd=${device.arcEnd}`);
        });
        
        this.devices = response.data;
        this.lastUpdated = new Date();
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async updateDeviceArc(deviceId, arcStart, arcEnd) {
      try {
        this.isLoading = true;
        const response = await api.put('/api/updateDeviceArc', {
          id: deviceId,
          arcStart,
          arcEnd
        });
        
        // Update local state to match the server
        const index = this.devices.findIndex(device => device.id === deviceId);
        if (index !== -1) {
          this.devices[index].arcStart = response.data.device.arcStart;
          this.devices[index].arcEnd = response.data.device.arcEnd;
        }
        
        return response.data;
      } catch (error) {
        console.error('Error updating device arc settings:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    setupWebSocketListeners() {
      const webSocketStore = useWebSocketStore();
      
      // When a device sends measurements, update the device in our store
      // Note: The websocket data contains the mac address which we can use to find the device
      const unsubscribeMeasurements = webSocketStore.$subscribe((mutation, state) => {
        if (state.clients && state.clients.length > 0) {
          // For each WebSocket client, update the corresponding device in the store
          state.clients.forEach(wsClient => {
            if (wsClient.mac) {
              // Find the device by MAC address (most reliable identifier)
              const deviceIndex = this.devices.findIndex(device => device.macAddress === wsClient.mac);
              
              if (deviceIndex !== -1) {
                // Update real-time data but keep persistent settings like arcStart/arcEnd
                this.devices[deviceIndex] = {
                  ...this.devices[deviceIndex],
                  lastConnection: new Date(), // Update the connection time
                  // If the client has a clientId, update it (in case it changed)
                  ...(wsClient.clientId && { clientId: wsClient.clientId })
                };
              }
            }
          });
        }
      });
      
      // Return cleanup function
      return () => {
        unsubscribeMeasurements();
      };
    },
    
    // Initialize store - call this on app boot
    async initialize() {
      await this.fetchDevices();
      this.setupWebSocketListeners();
    }
  }
});