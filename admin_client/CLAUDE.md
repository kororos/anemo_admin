# Coding Conventions for Anemo Admin

## Framework & Libraries

- **Frontend Framework**: Vue.js 3 with Composition API
- **UI Framework**: Quasar (v2.18.1)
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Data Visualization**: D3.js
- **Routing**: Vue Router

## Project Structure

- `src/components/`: Reusable Vue components
- `src/pages/`: Page components that represent routes
- `src/layouts/`: Layout components used by pages
- `src/stores/`: Pinia stores for state management
- `src/boot/`: Boot files that run before the app is initialized
- `src/router/`: Router configuration
- `src/assets/`: Static assets like images
- `src/css/`: Global CSS styles

## Component Conventions

### Component Communication

1. **Event Emission**:
   - Components should not directly take action on events
   - Instead, emit events upward for parent components to handle
   - Use `defineEmits()` to declare emitted events in component setup
   - Example:
   ```js
   const emit = defineEmits(['device-selected']);
   
   const onRowClick = (evt, row) => {
     emit('device-selected', row.clientId);
   }
   ```

2. **Event Handling**:
   - Parent components should listen for events and handle actions
   - Example:
   ```html
   <DevicesInfoTable @device-selected="handleDeviceSelected" />
   ```

### Component Structure

1. **Script Setup**:
   - Use `<script setup>` syntax for components
   - Import dependencies at the top
   - Define props, emits, and reactive state
   - Define component methods and lifecycle hooks

2. **Composition API**:
   - Use Vue 3 Composition API (ref, computed, etc.) for component logic
   - Organize related functionality together
   - Use `onMounted()` for initialization code

### State Management

1. **Store Structure**:
   - Use Pinia for state management
   - Create separate stores for different domains (auth, websocket, etc.)
   - Use the store setup syntax with composable functions

2. **Store Usage**:
   - Import and use store with the appropriate hook
   - Example: `const store = useWebSocketStore();`
   - Subscribe to store changes when needed

## Styling

1. **CSS Structure**:
   - SCSS for styling
   - Quasar CSS variables for theming
   - Global styles in `src/css/`

## API Communication

1. **HTTP Requests**:
   - Use Axios for HTTP requests
   - Handle errors and loading states
   - Emit events for API success/failure

2. **WebSocket**:
   - Use dedicated store for WebSocket state
   - Reactively update UI based on WebSocket events

## Code Quality

1. **Linting & Formatting**:
   - ESLint for code linting
   - Prettier for code formatting
   - Run `npm run lint` to check code quality
   - Run `npm run format` to format code

2. **Documentation**:
   - Use JSDoc comments for functions and components
   - Provide clear, descriptive comments for complex logic

## Testing

- Currently, no test specifications are defined (`npm test` exits with code 0)

## Build & Development

- Use `npm run dev` for development
- Use `npm run build` for production builds