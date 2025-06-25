import {render, screen} from '@testing-library/react';
import {test, expect} from 'vitest';
import '@testing-library/jest-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
// import { MemoryRouter } from 'react-router-dom';

test('renders without crashing', () => {
    const {container} = render(
        <AuthProvider>
            <App />
        </AuthProvider>
    );
    expect(container.querySelector('.App')).toBeInTheDocument();
});
