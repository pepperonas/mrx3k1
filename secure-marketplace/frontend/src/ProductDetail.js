import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Shield, ArrowLeft, ShoppingCart, Plus, Minus,
    Lock, AlertTriangle, User, MessageCircle,
    Eye, Download, ExternalLink
} from 'lucide-react';

const ProductDetail = ({ pgpKeys, showToast }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [decryptedDetails, setDecryptedDetails] = useState(null);
    const [showDecryptedDetails, setShowDecryptedDetails] = useState(false);
    const { id } = useParams();

    useEffect(() => {
        // Demo-Daten laden
        setLoading(true);
        setTimeout(() => {
            const demoProducts = {
                "p1": {
                    _id: "p1",
                    name: "Verschlüsselte Kommunikation",
                    price: 299.99,
                    description: "Eine hochsichere End-to-End verschlüsselte Kommunikationslösung für Unternehmen und Privatpersonen. Schützt Ihre Daten vor unbefugtem Zugriff und bietet fortschrittliche Sicherheitsfunktionen.",
                    longDescription: `
            <h3>End-to-End verschlüsselte Kommunikation</h3>
            <p>Diese Lösung bietet eine vollständige Ende-zu-Ende-Verschlüsselung für alle Ihre Kommunikationswege, sodass nur autorisierte Empfänger Ihre Nachrichten lesen können.</p>
            
            <h3>Hauptfunktionen:</h3>
            <ul>
              <li>256-bit AES-Verschlüsselung für alle Nachrichten</li>
              <li>Forward Secrecy zur Sicherung vergangener Kommunikation</li>
              <li>Unterstützung für sichere Gruppenkommunikation</li>
              <li>Automatische Schlüsselverwaltung</li>
              <li>Unterstützung für mehrere Geräte</li>
              <li>Regelmäßige Sicherheitsaudits durch externe Experten</li>
            </ul>
            
            <h3>Technische Spezifikationen:</h3>
            <p>Die Lösung verwendet modernste kryptographische Algorithmen und folgt den höchsten Sicherheitsstandards der Branche.</p>
          `,
                    vendor: { _id: "v1", username: "SecurityVendor" },
                    category: "Security",
                    rating: 4.7,
                    reviews: 124,
                    inStock: true,
                    tags: ["Verschlüsselung", "Kommunikation", "Datenschutz"],
                    encryptedDetails: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v4.10.8\nComment: https://openpgpjs.org\n\nHier befinden sich verschlüsselte Installationsanweisungen und Lizenzschlüssel für das Produkt.\n-----END PGP MESSAGE-----"
                },
                "p2": {
                    _id: "p2",
                    name: "Anonymes VPN",
                    price: 99.99,
                    description: "VPN-Dienst mit Fokus auf Anonymität, keine Protokollierung, Standorte in mehreren Ländern und fortschrittliche Sicherheitsmaßnahmen.",
                    longDescription: `
            <h3>Anonym im Internet</h3>
            <p>Unser VPN-Dienst wurde mit dem Fokus auf maximale Anonymität entwickelt. Wir protokollieren keinerlei Nutzerdaten oder Verbindungsinformationen.</p>
            
            <h3>Hauptfunktionen:</h3>
            <ul>
              <li>Keine Log-Richtlinie - wir speichern nichts</li>
              <li>Server in über 60 Ländern</li>
              <li>Unbegrenzte Bandbreite</li>
              <li>Bis zu 10 gleichzeitige Verbindungen</li>
              <li>Kill-Switch-Funktion</li>
              <li>DNS-Leckschutz</li>
            </ul>
            
            <h3>Plattformunterstützung:</h3>
            <p>Für alle gängigen Plattformen: Windows, macOS, Linux, Android, iOS</p>
          `,
                    vendor: { _id: "v2", username: "PrivacyExpert" },
                    category: "Privacy",
                    rating: 4.5,
                    reviews: 89,
                    inStock: true,
                    tags: ["VPN", "Anonymität", "Keine Protokollierung"]
                },
                "p3": {
                    _id: "p3",
                    name: "Security Audit",
                    price: 499.99,
                    description: "Umfassender Sicherheits-Audit für Ihr System, der Schwachstellen identifiziert und Empfehlungen für Verbesserungen gibt.",
                    longDescription: `
            <h3>Professioneller Sicherheitsaudit</h3>
            <p>Unser Team aus erfahrenen Sicherheitsexperten führt eine gründliche Analyse Ihrer Systeme durch, um potenzielle Schwachstellen zu identifizieren.</p>
            
            <h3>Audit-Umfang:</h3>
            <ul>
              <li>Netzwerksicherheit und Infrastruktur</li>
              <li>Anwendungssicherheit</li>
              <li>Physische Sicherheitsmaßnahmen</li>
              <li>Bewertung von Sicherheitsrichtlinien</li>
              <li>Mitarbeiterschulung und -bewusstsein</li>
              <li>Überprüfung der Einhaltung von Vorschriften</li>
            </ul>
            
            <h3>Lieferumfang:</h3>
            <p>Nach Abschluss des Audits erhalten Sie einen detaillierten Bericht mit identifizierten Schwachstellen, Risikobewertungen und priorisierten Empfehlungen zur Behebung.</p>
          `,
                    vendor: { _id: "v3", username: "AuditPro" },
                    category: "Services",
                    rating: 4.9,
                    reviews: 56,
                    inStock: true,
                    tags: ["Audit", "Sicherheitsbewertung", "Schwachstellenerkennung"]
                }
            };

            setProduct(demoProducts[id] || null);
            if (!demoProducts[id]) {
                setError('Produkt nicht gefunden');
            }
            setLoading(false);
        }, 500);
    }, [id]);

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const increaseQuantity = () => {
        setQuantity(quantity + 1);
    };

    const handleAddToCart = () => {
        showToast(`${quantity}x ${product.name} wurde zum Warenkorb hinzugefügt`, 'success');
    };

    const decryptDetails = () => {
        // Demo-Entschlüsselung
        setDecryptedDetails("Herzlichen Glückwunsch zum Kauf! Ihr Lizenzschlüssel: SECURE-1234-5678-9ABC-DEF0");
        setShowDecryptedDetails(true);
    };

    const handleContactVendor = () => {
        window.location.href = "/marketplace/messages";
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-secondary rounded-lg shadow-md p-8 text-center">
                    <AlertTriangle className="h-16 w-16 text-error mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-text-light mb-2">Produkt nicht gefunden</h2>
                    <p className="text-text-dark mb-6">{error || 'Das angeforderte Produkt ist nicht verfügbar'}</p>
                    <Link to="/marketplace" className="inline-flex items-center justify-center px-4 py-2 bg-accent hover:bg-blue-700 text-white rounded-lg transition duration-200">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Zurück zur Produktübersicht
                    </Link>
                </div>
            </div>
        );
    }

    // Sternebewertung
    const RatingStars = ({ rating, size = 'sm' }) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <svg
                        key={i}
                        className={`${starSize} ${i < fullStars ? 'text-yellow-400' : (i === fullStars && hasHalfStar ? 'text-yellow-400' : 'text-gray-400')}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className={`ml-1 text-text-dark ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
          {rating.toFixed(1)} ({product.reviews} Bewertungen)
        </span>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Navigationspfad */}
            <div className="mb-6">
                <div className="flex items-center text-sm text-text-dark">
                    <Link to="/marketplace" className="hover:text-accent">Produkte</Link>
                    <span className="mx-2">/</span>
                    <Link to={`/marketplace?category=${product.category}`} className="hover:text-accent">{product.category}</Link>
                    <span className="mx-2">/</span>
                    <span className="text-text-light">{product.name}</span>
                </div>
            </div>

            <div className="bg-secondary rounded-lg shadow-card overflow-hidden mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                    {/* Produkt-Thumbnail und Galerie */}
                    <div>
                        <div className="bg-primary rounded-lg p-12 flex items-center justify-center mb-4">
                            {product.category === 'Security' ? (
                                <Shield className="h-32 w-32 text-accent" />
                            ) : product.category === 'Privacy' ? (
                                <Lock className="h-32 w-32 text-accent" />
                            ) : (
                                <Eye className="h-32 w-32 text-accent" />
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <RatingStars rating={product.rating} size="md" />
                            <div className="flex items-center">
                                <User className="h-5 w-5 text-text-dark mr-1" />
                                <span className="text-text-dark">Anbieter: {product.vendor.username}</span>
                            </div>
                        </div>
                    </div>

                    {/* Produktinfo und Kaufoptionen */}
                    <div>
                        <h1 className="text-3xl font-bold text-text-light mb-2">{product.name}</h1>
                        <div className="text-3xl font-bold text-accent mb-4">${product.price.toFixed(2)}</div>

                        <p className="text-text mb-6">{product.description}</p>

                        <div className="mb-6">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {product.tags && product.tags.map(tag => (
                                    <span key={tag} className="bg-primary text-text-light px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                                ))}
                            </div>

                            <div className="flex items-center">
                <span className={`flex items-center font-medium ${product.inStock ? 'text-success' : 'text-error'}`}>
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${product.inStock ? 'bg-success' : 'bg-error'}`}></span>
                    {product.inStock ? 'Auf Lager' : 'Nicht verfügbar'}
                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center mb-4">
                                <button
                                    onClick={decreaseQuantity}
                                    className="p-2 bg-primary hover:bg-gray-700 rounded-l-lg border border-gray-700"
                                >
                                    <Minus className="h-5 w-5 text-text-light" />
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 px-3 py-2 bg-primary border-t border-b border-gray-700 text-center text-text-light focus:outline-none"
                                    min="1"
                                />
                                <button
                                    onClick={increaseQuantity}
                                    className="p-2 bg-primary hover:bg-gray-700 rounded-r-lg border border-gray-700"
                                >
                                    <Plus className="h-5 w-5 text-text-light" />
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    <span>In den Warenkorb</span>
                                </button>

                                <button
                                    onClick={handleContactVendor}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-gray-700 text-text-light font-medium rounded-lg transition duration-200 border border-gray-700"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    <span>Verkäufer kontaktieren</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Produktdetails */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-secondary rounded-lg shadow-md p-6 md:p-8">
                        <h2 className="text-2xl font-bold text-text-light mb-6">Produktdetails</h2>
                        <div
                            className="prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.longDescription }}
                        />
                    </div>
                </div>
                <div className="lg:col-span-1">
                    {/* Verschlüsselte Details, falls vorhanden */}
                    {product.encryptedDetails && (
                        <div className="bg-secondary rounded-lg shadow-md p-6 mb-6">
                            <h3 className="text-lg font-semibold text-text-light mb-4 flex items-center">
                                <Lock className="h-5 w-5 mr-2 text-accent" />
                                Verschlüsselte Details
                            </h3>

                            {showDecryptedDetails ? (
                                <div className="bg-primary rounded-lg p-4 border border-accent">
                                    <h4 className="font-medium text-accent mb-2">Entschlüsselte Information:</h4>
                                    <p className="text-text mb-4">{decryptedDetails}</p>
                                    <button
                                        onClick={() => setShowDecryptedDetails(false)}
                                        className="text-text-dark hover:text-text-light text-sm flex items-center"
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Verbergen
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-text-dark mb-4">Dieses Produkt enthält verschlüsselte Informationen, die nur mit Ihrem Schlüssel entschlüsselt werden können.</p>
                                    <button
                                        onClick={decryptDetails}
                                        className="w-full py-2 px-4 bg-primary hover:bg-gray-700 text-text-light rounded-lg border border-gray-700 transition duration-200 flex items-center justify-center"
                                    >
                                        <Eye className="h-5 w-5 mr-2" />
                                        <span>Mit meinem Schlüssel entschlüsseln</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Verkäuferinformationen */}
                    <div className="bg-secondary rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold text-text-light mb-4 flex items-center">
                            <User className="h-5 w-5 mr-2 text-accent" />
                            Über den Verkäufer
                        </h3>
                        <div className="flex items-center mb-4">
                            <div className="bg-primary p-3 rounded-full mr-3">
                                <User className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <h4 className="font-medium text-text-light">{product.vendor.username}</h4>
                                <p className="text-text-dark text-sm">Verifizierter Anbieter</p>
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <button
                                onClick={handleContactVendor}
                                className="py-2 px-4 bg-primary hover:bg-gray-700 text-text-light rounded-lg border border-gray-700 transition duration-200 flex items-center justify-center"
                            >
                                <MessageCircle className="h-5 w-5 mr-2" />
                                <span>Nachricht senden</span>
                            </button>
                            <Link
                                to={`/marketplace?vendor=${product.vendor._id}`}
                                className="py-2 px-4 bg-primary hover:bg-gray-700 text-text-light rounded-lg border border-gray-700 transition duration-200 flex items-center justify-center"
                            >
                                <ExternalLink className="h-5 w-5 mr-2" />
                                <span>Alle Produkte anzeigen</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;