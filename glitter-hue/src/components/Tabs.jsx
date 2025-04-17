// Tabs.jsx - Tabs-Komponente für die Navigation
import React from 'react';

export const Tab = ({ children, label, id, active }) => {
    return (
        <div role="tabpanel" className={`tab-content ${active ? 'active' : ''}`} id={`tab-${id}`}>
            {children}
        </div>
    );
};

export const Tabs = ({ children, activeTab, onChange }) => {
    // Filtere nur Tab-Komponenten
    const tabs = React.Children.toArray(children).filter(
        child => child.type === Tab
    );

    const handleTabClick = (id) => {
        onChange(id);
    };

    return (
        <div className="tabs-container">
            <div className="tabs-header" role="tablist">
                {tabs.map(tab => (
                    <button
                        key={tab.props.id}
                        role="tab"
                        className={`tab-button ${activeTab === tab.props.id ? 'active' : ''}`}
                        id={`tab-button-${tab.props.id}`}
                        aria-selected={activeTab === tab.props.id}
                        aria-controls={`tab-${tab.props.id}`}
                        onClick={() => handleTabClick(tab.props.id)}
                    >
                        {tab.props.label}
                    </button>
                ))}
            </div>
            <div className="tabs-body">
                {React.Children.map(tabs, tab =>
                    React.cloneElement(tab, { active: activeTab === tab.props.id })
                )}
            </div>
        </div>
    );
};