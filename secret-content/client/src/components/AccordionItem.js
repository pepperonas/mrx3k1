// Verbesserte Version von AccordionItem.js
import React, { useState } from 'react';

function AccordionItem({ category, activities }) {
    const [isOpen, setIsOpen] = useState(false);

    // Kategorie mit erstem Buchstaben groß
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);

    return (
        <div className="accordion-item">
            <div
                className="accordion-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                {formattedCategory} <span className="arrow">{isOpen ? '▲' : '▼'}</span>
            </div>
            <div
                className={`accordion-content ${isOpen ? 'open' : ''}`}
                style={{ maxHeight: isOpen ? `${activities.length * 60}px` : '0' }}
            >
                <ul>
                    {activities.map((activity, index) => (
                        <li key={index}>{activity}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default AccordionItem;