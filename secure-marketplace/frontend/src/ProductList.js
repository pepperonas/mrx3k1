import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Shield, Lock, Eye } from 'lucide-react';

const ProductList = ({ showToast }) => {
    const [products, setProducts] = useState([
        {
            _id: "p1",
            name: "Verschlüsselte Kommunikation",
            price: 299.99,
            vendor: { username: "SecurityVendor" },
            description: "End-to-End verschlüsselte Kommunikationslösung",
            category: "Security",
            rating: 4.7,
            thumbnail: "shield"
        },
        {
            _id: "p2",
            name: "Anonymes VPN",
            price: 99.99,
            vendor: { username: "PrivacyExpert" },
            description: "VPN-Dienst mit Fokus auf Anonymität",
            category: "Privacy",
            rating: 4.5,
            thumbnail: "lock"
        },
        {
            _id: "p3",
            name: "Security Audit",
            price: 499.99,
            vendor: { username: "AuditPro" },
            description: "Umfassender Sicherheits-Audit für Ihr System",
            category: "Services",
            rating: 4.9,
            thumbnail: "eye"
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        search: '',
        page: 1
    });
    const [pagination, setPagination] = useState({
        total: 3,
        pages: 1
    });

    const handleSearchChange = (e) => {
        setFilters({
            ...filters,
            search: e.target.value,
            page: 1
        });
    };

    const handleCategoryChange = (e) => {
        setFilters({
            ...filters,
            category: e.target.value,
            page: 1
        });
    };

    // Thumbnail-Komponente für Produkte
    const ProductThumbnail = ({ type }) => {
        const bgColor = 'bg-accent';

        if (type === 'shield') {
            return (
                <div className={`${bgColor} p-4 rounded-lg flex items-center justify-center`}>
                    <Shield className="h-10 w-10 text-white" />
                </div>
            );
        } else if (type === 'lock') {
            return (
                <div className={`${bgColor} p-4 rounded-lg flex items-center justify-center`}>
                    <Lock className="h-10 w-10 text-white" />
                </div>
            );
        } else {
            return (
                <div className={`${bgColor} p-4 rounded-lg flex items-center justify-center`}>
                    <Eye className="h-10 w-10 text-white" />
                </div>
            );
        }
    };

    // Sternebewertung
    const RatingStars = ({ rating }) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <svg
                        key={i}
                        className={`h-4 w-4 ${i < fullStars ? 'text-yellow-400' : (i === fullStars && hasHalfStar ? 'text-yellow-400' : 'text-gray-400')}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        {i < fullStars || (i === fullStars && hasHalfStar) ? (
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        ) : (
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        )}
                    </svg>
                ))}
                <span className="ml-1 text-text-dark text-sm">{rating.toFixed(1)}</span>
            </div>
        );
    };

    // Kategorie-Badge
    const CategoryBadge = ({ category }) => {
        let bgColor = 'bg-blue-500';

        if (category === 'Security') {
            bgColor = 'bg-red-500';
        } else if (category === 'Privacy') {
            bgColor = 'bg-purple-500';
        } else if (category === 'Services') {
            bgColor = 'bg-green-500';
        }

        return (
            <span className={`${bgColor} text-white text-xs px-2 py-1 rounded-full font-medium`}>
        {category}
      </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-light mb-4">Sicherheitsprodukte & Dienste</h1>
                <p className="text-text-dark">Entdecken Sie unsere sorgfältig ausgewählten Sicherheitsprodukte und -dienste von vertrauenswürdigen Anbietern.</p>
            </div>

            {/* Filter-Leiste */}
            <div className="bg-secondary rounded-lg shadow-md p-4 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Produkte suchen..."
                            value={filters.search}
                            onChange={handleSearchChange}
                            className="block w-full pl-10 pr-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                        />
                    </div>
                    <div className="relative w-full md:w-48">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-500" />
                        </div>
                        <select
                            value={filters.category}
                            onChange={handleCategoryChange}
                            className="block w-full pl-10 pr-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light appearance-none"
                        >
                            <option value="">Alle Kategorien</option>
                            <option value="Security">Security</option>
                            <option value="Privacy">Privacy</option>
                            <option value="Services">Services</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Produktliste */}
            {loading ? (
                <div className="flex justify-center my-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-xl text-text-dark">Keine Produkte gefunden</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product._id} className="bg-secondary rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-300 overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <ProductThumbnail type={product.thumbnail} />
                                    <CategoryBadge category={product.category} />
                                </div>
                                <h3 className="text-xl font-semibold text-text-light mb-2 truncate">{product.name}</h3>
                                <p className="text-text-dark mb-4 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-2xl font-bold text-accent">${product.price.toFixed(2)}</span>
                                    <RatingStars rating={product.rating} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-text-dark text-sm">Anbieter: {product.vendor.username}</span>
                                    <Link
                                        to={`/marketplace/product/${product._id}`}
                                        className="inline-flex items-center justify-center px-4 py-2 bg-accent hover:bg-blue-700 text-white rounded-lg transition duration-200"
                                    >
                                        Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-2">
                        <button
                            onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
                            disabled={filters.page <= 1}
                            className="px-3 py-1 bg-secondary border border-gray-700 rounded-md text-text-light disabled:opacity-50"
                        >
                            Zurück
                        </button>
                        {[...Array(pagination.pages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setFilters({...filters, page: i + 1})}
                                className={`px-3 py-1 rounded-md ${
                                    filters.page === i + 1
                                        ? 'bg-accent text-white'
                                        : 'bg-secondary border border-gray-700 text-text-light'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setFilters({...filters, page: Math.min(pagination.pages, filters.page + 1)})}
                            disabled={filters.page >= pagination.pages}
                            className="px-3 py-1 bg-secondary border border-gray-700 rounded-md text-text-light disabled:opacity-50"
                        >
                            Weiter
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default ProductList;