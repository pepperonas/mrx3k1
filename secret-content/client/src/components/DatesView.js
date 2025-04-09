import React, { useState } from 'react';
import AccordionItem from './AccordionItem';

function DatesView({ datesData, onBack }) {
    return (
        <div className="dates-view">
            <div className="accordion">
                {datesData.map((item, index) => (
                    <AccordionItem
                        key={index}
                        category={item.kategorie}
                        activities={item.aktivitaeten}
                    />
                ))}
            </div>
            <div className="button-container">
                <button className="secondary-btn" onClick={onBack}>Zurück</button>
            </div>
        </div>
    );
}

export default DatesView;