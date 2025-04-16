import React, {useEffect, useRef, useState} from 'react';
import {
    Check,
    CheckCheck,
    Info,
    Lock,
    Mail,
    MoreVertical,
    Paperclip,
    Search,
    Send,
    User
} from 'lucide-react';


const Messages = ({user, encryptMessage, decryptMessage, showToast}) => {
    // Demo-Daten
    const [contacts, setContacts] = useState([
        {
            id: "u1",
            username: "SecurityVendor",
            avatar: null,
            lastMessage: "Danke für Ihre Nachricht. Welche Produkte interessieren Sie?",
            lastMessageTime: new Date(Date.now() - 36000000),
            unread: 0,
            online: true
        },
        {
            id: "u2",
            username: "PrivacyExpert",
            avatar: null,
            lastMessage: "Ich kann Ihnen helfen, ein sicheres VPN einzurichten.",
            lastMessageTime: new Date(Date.now() - 86400000 * 2),
            unread: 2,
            online: false
        },
        {
            id: "u3",
            username: "AuditPro",
            avatar: null,
            lastMessage: "Wir können morgen mit dem Security Audit beginnen.",
            lastMessageTime: new Date(Date.now() - 86400000 * 5),
            unread: 0,
            online: false
        }
    ]);

    const [messages, setMessages] = useState([
        {
            _id: "m1",
            sender: {_id: "u1", username: "SecurityVendor"},
            recipient: {_id: "user123", username: "demo_user"},
            encryptedContent: "-----BEGIN PGP MESSAGE-----\nHallo, ich bin interessiert an Ihren Sicherheitsprodukten.\n-----END PGP MESSAGE-----",
            decryptedContent: "Hallo, ich bin interessiert an Ihren Sicherheitsprodukten.",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            read: true
        },
        {
            _id: "m2",
            sender: {_id: "user123", username: "demo_user"},
            recipient: {_id: "u1", username: "SecurityVendor"},
            encryptedContent: "-----BEGIN PGP MESSAGE-----\nDanke für Ihre Nachricht. Welche Produkte interessieren Sie?\n-----END PGP MESSAGE-----",
            decryptedContent: "Danke für Ihre Nachricht. Welche Produkte interessieren Sie?",
            createdAt: new Date(Date.now() - 36000000).toISOString(),
            read: true
        },
        {
            _id: "m3",
            sender: {_id: "u2", username: "PrivacyExpert"},
            recipient: {_id: "user123", username: "demo_user"},
            encryptedContent: "-----BEGIN PGP MESSAGE-----\nHallo! Ich habe gesehen, dass Sie Interesse an unserem VPN-Dienst haben.\n-----END PGP MESSAGE-----",
            decryptedContent: "Hallo! Ich habe gesehen, dass Sie Interesse an unserem VPN-Dienst haben.",
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            read: true
        },
        {
            _id: "m4",
            sender: {_id: "u2", username: "PrivacyExpert"},
            recipient: {_id: "user123", username: "demo_user"},
            encryptedContent: "-----BEGIN PGP MESSAGE-----\nIch kann Ihnen helfen, ein sicheres VPN einzurichten.\n-----END PGP MESSAGE-----",
            decryptedContent: "Ich kann Ihnen helfen, ein sicheres VPN einzurichten.",
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            read: false
        },
        {
            _id: "m5",
            sender: {_id: "u3", username: "AuditPro"},
            recipient: {_id: "user123", username: "demo_user"},
            encryptedContent: "-----BEGIN PGP MESSAGE-----\nVielen Dank für Ihr Interesse an unserem Security Audit Service.\n-----END PGP MESSAGE-----",
            decryptedContent: "Vielen Dank für Ihr Interesse an unserem Security Audit Service.",
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            read: true
        },
        {
            _id: "m6",
            sender: {_id: "u3", username: "AuditPro"},
            recipient: {_id: "user123", username: "demo_user"},
            encryptedContent: "-----BEGIN PGP MESSAGE-----\nWir können morgen mit dem Security Audit beginnen.\n-----END PGP MESSAGE-----",
            decryptedContent: "Wir können morgen mit dem Security Audit beginnen.",
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            read: true
        }
    ]);

    const [selectedContact, setSelectedContact] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    // Beim Laden oder Wechsel des Kontakts zum Ende der Nachrichtenliste scrollen
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({behavior: 'smooth'});
        }
    }, [selectedContact, messages]);

    // Beim Wechsel des Kontakts die ungelesenen Nachrichten als gelesen markieren
    useEffect(() => {
        if (selectedContact) {
            // Ungelesene Nachrichten als gelesen markieren
            setContacts(contacts.map(contact =>
                contact.id === selectedContact.id ? {...contact, unread: 0} : contact
            ));

            // Demo: Nachrichten als gelesen markieren
            setMessages(messages.map(msg =>
                msg.sender._id === selectedContact.id && msg.recipient._id === user._id && !msg.read
                    ? {...msg, read: true}
                    : msg
            ));
        }
    }, [selectedContact]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedContact) return;

        try {
            // Demo-Nachricht erstellen
            const encrypted = await encryptMessage(newMessage, "dummy_key");

            const newMsg = {
                _id: "m" + Date.now(),
                sender: {_id: user._id, username: user.username},
                recipient: {_id: selectedContact.id, username: selectedContact.username},
                encryptedContent: encrypted,
                decryptedContent: newMessage,
                createdAt: new Date().toISOString(),
                read: false
            };

            setMessages([...messages, newMsg]);

            // Update der letzten Nachricht im Kontakt
            setContacts(contacts.map(contact =>
                contact.id === selectedContact.id
                    ? {
                        ...contact,
                        lastMessage: newMessage,
                        lastMessageTime: new Date()
                    }
                    : contact
            ));

            setNewMessage('');

            // Demo: Automatische Antwort nach 1-2 Sekunden
            setTimeout(() => {
                const replies = [
                    "Danke für Ihre Nachricht. Ich werde das überprüfen.",
                    "Ich verstehe Ihr Anliegen. Wie kann ich Ihnen weiterhelfen?",
                    "Interessant. Können Sie mir mehr Details geben?",
                    "Vielen Dank für die Information. Ich melde mich bei Ihnen.",
                    "Das klingt gut. Ich werde mich darum kümmern."
                ];

                const replyText = replies[Math.floor(Math.random() * replies.length)];
                const replyEncrypted = encryptMessage(replyText, "dummy_key");

                const replyMsg = {
                    _id: "m" + Date.now() + 1,
                    sender: {_id: selectedContact.id, username: selectedContact.username},
                    recipient: {_id: user._id, username: user.username},
                    encryptedContent: replyEncrypted,
                    decryptedContent: replyText,
                    createdAt: new Date().toISOString(),
                    read: true
                };

                setMessages(prevMessages => [...prevMessages, replyMsg]);

                // Update der letzten Nachricht im Kontakt
                setContacts(prevContacts => prevContacts.map(contact =>
                    contact.id === selectedContact.id
                        ? {
                            ...contact,
                            lastMessage: replyText,
                            lastMessageTime: new Date()
                        }
                        : contact
                ));
            }, 1000 + Math.random() * 1000);
        } catch (error) {
            console.error('Fehler beim Senden der Nachricht:', error);
            showToast('Nachricht konnte nicht gesendet werden', 'error');
        }
    };

    const getMessages = () => {
        if (!selectedContact) return [];

        return messages.filter(msg =>
            (msg.sender._id === selectedContact.id && msg.recipient._id === user._id) ||
            (msg.sender._id === user._id && msg.recipient._id === selectedContact.id)
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    };

    const filteredContacts = contacts.filter(contact =>
        contact.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Formatieren des Datums für die Anzeige
    const formatDate = (date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Heute - zeige Uhrzeit
            return messageDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        } else if (diffDays === 1) {
            // Gestern
            return 'Gestern';
        } else if (diffDays < 7) {
            // Innerhalb einer Woche - zeige Wochentag
            const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
            return weekdays[messageDate.getDay()];
        } else {
            // Älter - zeige Datum
            return messageDate.toLocaleDateString([], {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-secondary rounded-lg shadow-card overflow-hidden">
                <div className="flex h-[70vh]">
                    {/* Kontaktliste */}
                    <div className="w-full md:w-80 bg-secondary border-r border-gray-700">
                        <div className="p-4 border-b border-gray-700">
                            <div className="relative">
                                <div
                                    className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-500"/>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Kontakte suchen..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-text-light text-sm"
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto h-[calc(70vh-68px)]">
                            {filteredContacts.length === 0 ? (
                                <div className="p-4 text-center text-text-dark">
                                    Keine Kontakte gefunden
                                </div>
                            ) : (
                                filteredContacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        onClick={() => setSelectedContact(contact)}
                                        className={`p-3 border-b border-gray-700 hover:bg-primary cursor-pointer transition-colors duration-150 ${selectedContact?.id === contact.id ? 'bg-primary' : ''}`}
                                    >
                                        <div className="flex items-center">
                                            <div className="relative">
                                                {contact.avatar ? (
                                                    <img
                                                        src={contact.avatar}
                                                        alt={contact.username}
                                                        className="w-12 h-12 rounded-full bg-gray-600"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                                                        <User className="h-6 w-6 text-white"/>
                                                    </div>
                                                )}
                                                {contact.online && (
                                                    <span
                                                        className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-secondary"></span>
                                                )}
                                            </div>
                                            <div className="ml-3 flex-1 overflow-hidden">
                                                <div
                                                    className="flex justify-between items-baseline">
                                                    <h3 className="text-text-light font-medium truncate">{contact.username}</h3>
                                                    <span
                                                        className="text-xs text-text-dark ml-2 whitespace-nowrap">
                            {formatDate(contact.lastMessageTime)}
                          </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm text-text-dark truncate">
                                                        {contact.lastMessage}
                                                    </p>
                                                    {contact.unread > 0 && (
                                                        <span
                                                            className="ml-2 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {contact.unread}
                            </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Nachrichtenbereich */}
                    <div className="hidden md:flex md:flex-1 flex-col bg-primary">
                        {selectedContact ? (
                            <>
                                {/* Header */}
                                <div
                                    className="flex items-center justify-between p-4 border-b border-gray-700 bg-secondary">
                                    <div className="flex items-center">
                                        {selectedContact.avatar ? (
                                            <img
                                                src={selectedContact.avatar}
                                                alt={selectedContact.username}
                                                className="w-10 h-10 rounded-full bg-gray-600"
                                            />
                                        ) : (
                                            <div
                                                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                                                <User className="h-5 w-5 text-white"/>
                                            </div>
                                        )}
                                        <div className="ml-3">
                                            <h3 className="text-text-light font-medium">{selectedContact.username}</h3>
                                            <p className="text-xs text-text-dark">
                                                {selectedContact.online ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <button
                                            className="p-2 rounded-full hover:bg-gray-700 text-text-dark">
                                            <Info className="h-5 w-5"/>
                                        </button>
                                        <button
                                            className="p-2 rounded-full hover:bg-gray-700 text-text-dark">
                                            <MoreVertical className="h-5 w-5"/>
                                        </button>
                                    </div>
                                </div>

                                {/* Nachrichtenliste */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="flex flex-col space-y-4">
                                        {getMessages().map(message => {
                                            const isOutgoing = message.sender._id === user._id;
                                            return (
                                                <div
                                                    key={message._id}
                                                    className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                                            isOutgoing
                                                                ? 'bg-accent text-white rounded-br-none'
                                                                : 'bg-secondary text-text-light rounded-bl-none'
                                                        }`}
                                                    >
                                                        <div className="break-words">
                                                            {message.decryptedContent}
                                                        </div>
                                                        <div
                                                            className="flex items-center justify-end mt-1 space-x-1">
                              <span className="text-xs opacity-75">
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                              </span>
                                                            {isOutgoing && (
                                                                message.read ? (
                                                                    <CheckCheck
                                                                        className="h-3 w-3 opacity-75"/>
                                                                ) : (
                                                                    <Check
                                                                        className="h-3 w-3 opacity-75"/>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef}/>
                                    </div>
                                </div>

                                {/* Eingabefeld */}
                                <div className="p-4 border-t border-gray-700 bg-secondary">
                                    <div className="flex items-center">
                                        <button
                                            className="p-2 rounded-full hover:bg-gray-700 text-text-dark">
                                            <Paperclip className="h-5 w-5"/>
                                        </button>
                                        <div className="flex-1 mx-2 relative">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                placeholder="Nachricht eingeben..."
                                                className="w-full px-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent text-text-light pr-10"
                                                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Lock className="h-4 w-4 text-accent"/>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className={`p-2 rounded-full ${
                                                newMessage.trim()
                                                    ? 'bg-accent hover:bg-blue-700 text-white'
                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            } transition-colors duration-200`}
                                        >
                                            <Send className="h-5 w-5"/>
                                        </button>
                                    </div>
                                    <div className="text-xs text-center mt-2 text-accent">
                                        <Lock className="h-3 w-3 inline mr-1"/>
                                        End-to-End verschlüsselt
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div
                                className="flex flex-col items-center justify-center h-full text-text-dark">
                                <Mail className="h-16 w-16 mb-4 text-gray-700"/>
                                <p className="text-lg">Wählen Sie einen Kontakt aus</p>
                                <p className="text-sm">um die Konversation anzuzeigen.</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile: Kein Kontakt ausgewählt */}
                    {!selectedContact && (
                        <div
                            className="md:hidden flex flex-1 flex-col items-center justify-center h-full text-text-dark">
                            <Mail className="h-16 w-16 mb-4 text-gray-700"/>
                            <p className="text-lg">Wählen Sie einen Kontakt aus</p>
                            <p className="text-sm">um die Konversation anzuzeigen.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;