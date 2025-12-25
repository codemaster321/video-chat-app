import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ChatProvider, useChatContext } from './ChatContext';

// Test component that uses the context
const TestConsumer: React.FC = () => {
    const { messages, chatMessage, isChatOpen, setChatMessage, setIsChatOpen, addMessage, clearMessages } = useChatContext();

    return (
        <div>
            <span data-testid="message-count">{messages.length}</span>
            <span data-testid="chat-message">{chatMessage}</span>
            <span data-testid="is-chat-open">{isChatOpen.toString()}</span>
            <button data-testid="add-message" onClick={() => addMessage({
                message: 'Test',
                sender: 'User',
                senderId: '123',
                timestamp: Date.now()
            })}>Add</button>
            <button data-testid="clear-messages" onClick={clearMessages}>Clear</button>
            <button data-testid="set-chat-message" onClick={() => setChatMessage('Hello')}>Set Message</button>
            <button data-testid="toggle-chat" onClick={() => setIsChatOpen(!isChatOpen)}>Toggle</button>
        </div>
    );
};

const renderWithProvider = () => {
    return render(
        <ChatProvider>
            <TestConsumer />
        </ChatProvider>
    );
};

describe('ChatContext', () => {
    describe('initial state', () => {
        it('should start with empty messages', () => {
            renderWithProvider();

            expect(screen.getByTestId('message-count').textContent).toBe('0');
        });

        it('should start with empty chat message', () => {
            renderWithProvider();

            expect(screen.getByTestId('chat-message').textContent).toBe('');
        });

        it('should start with chat closed', () => {
            renderWithProvider();

            expect(screen.getByTestId('is-chat-open').textContent).toBe('false');
        });
    });

    describe('addMessage', () => {
        it('should add a message to the list', async () => {
            renderWithProvider();

            await act(async () => {
                screen.getByTestId('add-message').click();
            });

            expect(screen.getByTestId('message-count').textContent).toBe('1');
        });
    });

    describe('clearMessages', () => {
        it('should clear all messages', async () => {
            renderWithProvider();

            await act(async () => {
                screen.getByTestId('add-message').click();
                screen.getByTestId('add-message').click();
            });

            await act(async () => {
                screen.getByTestId('clear-messages').click();
            });

            expect(screen.getByTestId('message-count').textContent).toBe('0');
        });
    });

    describe('setChatMessage', () => {
        it('should update the chat message', async () => {
            renderWithProvider();

            await act(async () => {
                screen.getByTestId('set-chat-message').click();
            });

            expect(screen.getByTestId('chat-message').textContent).toBe('Hello');
        });
    });

    describe('setIsChatOpen', () => {
        it('should toggle chat open state', async () => {
            renderWithProvider();

            expect(screen.getByTestId('is-chat-open').textContent).toBe('false');

            await act(async () => {
                screen.getByTestId('toggle-chat').click();
            });

            expect(screen.getByTestId('is-chat-open').textContent).toBe('true');
        });
    });
});
