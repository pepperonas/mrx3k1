import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package, ChevronDown, ChevronUp, Download,
    Clock, DollarSign, ShoppingCart, ExternalLink,
    Info, AlertTriangle, CheckCircle, Truck, Calendar
} from 'lucide-react';

const Orders = ({ user, decryptMessage, showToast }) => {
    // Demo-Bestellungen
    const [orders, setOrders] = useState([
        {
            _id: "o1",
            orderNumber: "ORD-20240415-001",
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            totalPrice: 299.99,
            status: "completed",
            paymentStatus: "paid",
            paymentMethod: "Kreditkarte",
            transactionId: "TRX12345678",
            products: [
                {
                    product: {
                        _id: "p1",
                        name: "Verschlüsselte Kommunikation",
                        price: 299.99
                    },
                    quantity: 1
                }
            ],
            shippingAddress: {
                name: "Demo User",
                street: "Sicherheitsstraße 42",
                city: "Berlin",
                postalCode: "10115",
                country: "Deutschland"
            },
            notes: "Lieferung erfolgt digital per E-Mail",
            timeline: [
                { time: new Date(Date.now() - 86400000 * 3).toISOString(), status: "pending", description: "Bestellung aufgegeben" },
                { time: new Date(Date.now() - 86400000 * 3 + 7200000).toISOString(), status: "processing", description: "Zahlung bestätigt" },
                { time: new Date(Date.now() - 86400000 * 2).toISOString(), status: "shipped", description: "Produkt versendet" },
                { time: new Date(Date.now() - 86400000 * 1).toISOString(), status: "completed", description: "Bestellung abgeschlossen" }
            ]
        },
        {
            _id: "o2",
            orderNumber: "ORD-20240410-002",
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            totalPrice: 599.98,
            status: "shipped",
            paymentStatus: "paid",
            paymentMethod: "Überweisung",
            transactionId: "TRX87654321",
            products: [
                {
                    product: {
                        _id: "p3",
                        name: "Security Audit",
                        price: 499.99
                    },
                    quantity: 1
                },
                {
                    product: {
                        _id: "p2",
                        name: "Anonymes VPN",
                        price: 99.99
                    },
                    quantity: 1
                }
            ],
            shippingAddress: {
                name: "Demo User",
                street: "Sicherheitsstraße 42",
                city: "Berlin",
                postalCode: "10115",
                country: "Deutschland"
            },
            notes: "Bitte um schnelle Bearbeitung",
            timeline: [
                { time: new Date(Date.now() - 86400000 * 7).toISOString(), status: "pending", description: "Bestellung aufgegeben" },
                { time: new Date(Date.now() - 86400000 * 6).toISOString(), status: "processing", description: "Zahlung bestätigt" },
                { time: new Date(Date.now() - 86400000 * 2).toISOString(), status: "shipped", description: "Produkt versendet" }
            ]
        },
        {
            _id: "o3",
            orderNumber: "ORD-20240401-003",
            createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
            totalPrice: 99.99,
            status: "cancelled",
            paymentStatus: "refunded",
            paymentMethod: "PayPal",
            transactionId: "TRX11223344",
            products: [
                {
                    product: {
                        _id: "p2",
                        name: "Anonymes VPN",
                        price: 99.99
                    },
                    quantity: 1
                }
            ],
            shippingAddress: {
                name: "Demo User",
                street: "Sicherheitsstraße 42",
                city: "Berlin",
                postalCode: "10115",
                country: "Deutschland"
            },
            notes: "Storniert auf Kundenwunsch",
            timeline: [
                { time: new Date(Date.now() - 86400000 * 15).toISOString(), status: "pending", description: "Bestellung aufgegeben" },
                { time: new Date(Date.now() - 86400000 * 14).toISOString(), status: "processing", description: "Zahlung bestätigt" },
                { time: new Date(Date.now() - 86400000 * 13).toISOString(), status: "cancelled", description: "Bestellung storniert" },
                { time: new Date(Date.now() - 86400000 * 12).toISOString(), status: "refunded", description: "Rückerstattung veranlasst" }
            ]
        }
    ]);

    const [expandedOrder, setExpandedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        // Demo-Ladezustand simulieren
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

    const toggleOrderDetails = (orderId) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(order => order.status === filter);

    // Statusbadge mit entsprechender Farbcodierung
    const StatusBadge = ({ status }) => {
        let bgColor, icon;

        switch (status) {
            case 'pending':
                bgColor = 'bg-yellow-500';
                icon = Clock;
                break;
            case 'processing':
                bgColor = 'bg-blue-500';
                icon = ShoppingCart;
                break;
            case 'shipped':
                bgColor = 'bg-purple-500';
                icon = Truck;
                break;
            case 'completed':
                bgColor = 'bg-green-500';
                icon = CheckCircle;
                break;
            case 'cancelled':
            case 'disputed':
                bgColor = 'bg-red-500';
                icon = AlertTriangle;
                break;
            default:
                bgColor = 'bg-gray-500';
                icon = Info;
        }

        const Icon = icon;

        return (
            <span className={`${bgColor} text-white text-xs px-2 py-1 rounded-full flex items-center`}>
        <Icon className="h-3 w-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
        );
    };

    // Formatiere Datum
    const formatDate = (dateString) => {
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('de-DE', options);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-light">Meine Bestellungen</h1>
                <p className="text-text-dark mt-2">Verfolgen und verwalten Sie alle Ihre Bestellungen</p>
            </div>

            {/* Filter */}
            <div className="bg-secondary rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                            filter === 'all'
                                ? 'bg-accent text-white'
                                : 'bg-primary text-text-light hover:bg-gray-700'
                        }`}
                    >
                        Alle
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                            filter === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-primary text-text-light hover:bg-gray-700'
                        }`}
                    >
                        <Clock className="h-3 w-3 inline mr-1" />
                        Ausstehend
                    </button>
                    <button
                        onClick={() => setFilter('processing')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                            filter === 'processing'
                                ? 'bg-blue-500 text-white'
                                : 'bg-primary text-text-light hover:bg-gray-700'
                        }`}
                    >
                        <ShoppingCart className="h-3 w-3 inline mr-1" />
                        In Bearbeitung
                    </button>
                    <button
                        onClick={() => setFilter('shipped')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                            filter === 'shipped'
                                ? 'bg-purple-500 text-white'
                                : 'bg-primary text-text-light hover:bg-gray-700'
                        }`}
                    >
                        <Truck className="h-3 w-3 inline mr-1" />
                        Versendet
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                            filter === 'completed'
                                ? 'bg-green-500 text-white'
                                : 'bg-primary text-text-light hover:bg-gray-700'
                        }`}
                    >
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Abgeschlossen
                    </button>
                    <button
                        onClick={() => setFilter('cancelled')}
                        className={`px-3 py-1 rounded-lg text-sm ${
                            filter === 'cancelled'
                                ? 'bg-red-500 text-white'
                                : 'bg-primary text-text-light hover:bg-gray-700'
                        }`}
                    >
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Storniert
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center my-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-secondary rounded-lg shadow-md p-8 text-center">
                    <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-text-light mb-2">Keine Bestellungen gefunden</h2>
                    <p className="text-text-dark mb-6">Es wurden keine Bestellungen mit den ausgewählten Kriterien gefunden.</p>
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center px-4 py-2 bg-accent hover:bg-blue-700 text-white rounded-lg transition duration-200"
                    >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Produkte entdecken
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredOrders.map(order => (
                        <div key={order._id} className="bg-secondary rounded-lg shadow-card overflow-hidden">
                            {/* Bestellübersicht */}
                            <div
                                className="p-5 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
                                onClick={() => toggleOrderDetails(order._id)}
                            >
                                <div className="flex items-start md:items-center">
                                    <div className="mr-4">
                                        <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${order.status === 'completed' ? 'bg-green-500' :
                                            order.status === 'shipped' ? 'bg-purple-500' :
                                                order.status === 'processing' ? 'bg-blue-500' :
                                                    order.status === 'cancelled' ? 'bg-red-500' :
                                                        'bg-yellow-500'}
                    `}>
                                            {order.status === 'completed' ? <CheckCircle className="h-5 w-5 text-white" /> :
                                                order.status === 'shipped' ? <Truck className="h-5 w-5 text-white" /> :
                                                    order.status === 'processing' ? <ShoppingCart className="h-5 w-5 text-white" /> :
                                                        order.status === 'cancelled' ? <AlertTriangle className="h-5 w-5 text-white" /> :
                                                            <Clock className="h-5 w-5 text-white" />}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-text-light font-medium">Bestellung #{order.orderNumber}</h3>
                                        <div className="flex flex-wrap items-center mt-1 text-text-dark text-sm">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            <span>{formatDate(order.createdAt)}</span>
                                            <span className="mx-2">•</span>
                                            <DollarSign className="h-4 w-4 mr-1" />
                                            <span>${order.totalPrice.toFixed(2)}</span>
                                            <span className="hidden md:inline mx-2">•</span>
                                            <div className="mt-1 md:mt-0"><StatusBadge status={order.status} /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 md:mt-0 flex items-center">
                  <span className="text-text-dark text-sm mr-3">
                    {order.products.length} {order.products.length === 1 ? 'Artikel' : 'Artikel'}
                  </span>
                                    <button className="text-text-dark hover:text-text-light">
                                        {expandedOrder === order._id ?
                                            <ChevronUp className="h-5 w-5" /> :
                                            <ChevronDown className="h-5 w-5" />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Detailansicht */}
                            {expandedOrder === order._id && (
                                <div className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Produkte */}
                                        <div>
                                            <h4 className="text-text-light font-medium mb-3">Bestellte Artikel</h4>
                                            <div className="space-y-3">
                                                {order.products.map((item, index) => (
                                                    <div key={index} className="flex justify-between p-3 bg-primary rounded-lg">
                                                        <div>
                                                            <Link
                                                                to={`/marketplace/product/${item.product._id}`}
                                                                className="text-text-light hover:text-accent"
                                                            >
                                                                {item.product.name}
                                                            </Link>
                                                            <div className="text-text-dark text-sm">
                                                                Menge: {item.quantity}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-text-light">${item.product.price.toFixed(2)}</div>
                                                            <div className="text-text-dark text-sm">
                                                                ${(item.product.price * item.quantity).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Preiszusammenfassung */}
                                            <div className="mt-4 p-3 bg-primary rounded-lg">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-text-dark">Zwischensumme:</span>
                                                    <span className="text-text-light">${order.totalPrice.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-text-dark">Versand:</span>
                                                    <span className="text-text-light">$0.00</span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-gray-700 mt-2">
                                                    <span className="text-text-light font-medium">Gesamtsumme:</span>
                                                    <span className="text-accent font-bold">${order.totalPrice.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bestelldetails */}
                                        <div>
                                            <h4 className="text-text-light font-medium mb-3">Bestelldetails</h4>
                                            <div className="p-3 bg-primary rounded-lg mb-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-text-dark text-sm">Zahlung:</p>
                                                        <p className="text-text-light">{order.paymentMethod}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-text-dark text-sm">Status:</p>
                                                        <p className="text-text-light capitalize">{order.paymentStatus}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-text-dark text-sm">Transaktions-ID:</p>
                                                        <p className="text-text-light">{order.transactionId}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-text-dark text-sm">Lieferung:</p>
                                                        <p className="text-text-light">Standard</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <h4 className="text-text-light font-medium mb-3">Lieferadresse</h4>
                                            <div className="p-3 bg-primary rounded-lg mb-4">
                                                <p className="text-text-light">{order.shippingAddress.name}</p>
                                                <p className="text-text-light">{order.shippingAddress.street}</p>
                                                <p className="text-text-light">
                                                    {order.shippingAddress.postalCode} {order.shippingAddress.city}
                                                </p>
                                                <p className="text-text-light">{order.shippingAddress.country}</p>
                                            </div>

                                            {order.notes && (
                                                <>
                                                    <h4 className="text-text-light font-medium mb-3">Anmerkungen</h4>
                                                    <div className="p-3 bg-primary rounded-lg mb-4">
                                                        <p className="text-text-light">{order.notes}</p>
                                                    </div>
                                                </>
                                            )}

                                            <h4 className="text-text-light font-medium mb-3">Bestellverlauf</h4>
                                            <div className="p-3 bg-primary rounded-lg">
                                                <div className="space-y-3">
                                                    {order.timeline.map((event, index) => (
                                                        <div key={index} className="flex">
                                                            <div className={`
                                w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-3
                                ${event.status === 'completed' ? 'bg-green-500' :
                                                                event.status === 'shipped' ? 'bg-purple-500' :
                                                                    event.status === 'processing' ? 'bg-blue-500' :
                                                                        event.status === 'cancelled' || event.status === 'refunded' ? 'bg-red-500' :
                                                                            'bg-yellow-500'}
                              `}>
                                                                {event.status === 'completed' ? <CheckCircle className="h-4 w-4 text-white" /> :
                                                                    event.status === 'shipped' ? <Truck className="h-4 w-4 text-white" /> :
                                                                        event.status === 'processing' ? <ShoppingCart className="h-4 w-4 text-white" /> :
                                                                            event.status === 'cancelled' || event.status === 'refunded' ? <AlertTriangle className="h-4 w-4 text-white" /> :
                                                                                <Clock className="h-4 w-4 text-white" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between">
                                                                    <span className="text-text-light">{event.description}</span>
                                                                    <span className="text-text-dark text-sm">
                                    {new Date(event.time).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                  </span>
                                                                </div>
                                                                {index < order.timeline.length - 1 && (
                                                                    <div className="ml-3.5 mt-1 mb-1 border-l border-gray-700 h-4"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Aktionen */}
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        <button
                                            className="px-4 py-2 bg-primary hover:bg-gray-700 text-text-light rounded-lg border border-gray-700 transition duration-200 flex items-center"
                                            onClick={() => showToast('Rechnung heruntergeladen', 'success')}
                                        >
                                            <Download className="h-5 w-5 mr-2" />
                                            Rechnung herunterladen
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-primary hover:bg-gray-700 text-text-light rounded-lg border border-gray-700 transition duration-200 flex items-center"
                                            onClick={() => window.location.href = "/marketplace/messages"}
                                        >
                                            <ExternalLink className="h-5 w-5 mr-2" />
                                            Support kontaktieren
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;