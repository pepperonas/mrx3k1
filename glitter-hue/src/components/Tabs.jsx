// components/Tabs.jsx
import React, { useState, useRef, useEffect } from 'react';

export const Tab = ({ id, label, children, isActive, onClick }) => {
    return (
        <div className={`tab-content ${isActive ? 'active' : ''}`}>
            {children}
        </div>
    );
};

export const Tabs = ({ children, activeTab, onChange }) => {
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const tabsHeaderRef = useRef(null);

    // Überprüfen, ob Scroll-Pfeile angezeigt werden müssen
    const checkScrollButtons = () => {
        if (tabsHeaderRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsHeaderRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
        }
    };

    // Beim Laden und nach Größenänderung prüfen
    useEffect(() => {
        checkScrollButtons();
        window.addEventListener('resize', checkScrollButtons);
        return () => window.removeEventListener('resize', checkScrollButtons);
    }, []);

    // Nach Tab-Änderung erneut prüfen
    useEffect(() => {
        checkScrollButtons();

        // Scrolle aktiven Tab in Sicht
        if (tabsHeaderRef.current) {
            const activeTabElement = tabsHeaderRef.current.querySelector(`.tab-button.active`);
            if (activeTabElement) {
                const headerRect = tabsHeaderRef.current.getBoundingClientRect();
                const tabRect = activeTabElement.getBoundingClientRect();

                if (tabRect.left < headerRect.left) {
                    tabsHeaderRef.current.scrollLeft += tabRect.left - headerRect.left - 20;
                } else if (tabRect.right > headerRect.right) {
                    tabsHeaderRef.current.scrollLeft += tabRect.right - headerRect.right + 20;
                }
            }
        }
    }, [activeTab]);

    // Nach links scrollen
    const scrollLeft = () => {
        if (tabsHeaderRef.current) {
            tabsHeaderRef.current.scrollLeft -= 200;
            setTimeout(checkScrollButtons, 100);
        }
    };

    // Nach rechts scrollen
    const scrollRight = () => {
        if (tabsHeaderRef.current) {
            tabsHeaderRef.current.scrollLeft += 200;
            setTimeout(checkScrollButtons, 100);
        }
    };

    // Reagiere auf Scroll-Ereignisse
    const handleScroll = () => {
        checkScrollButtons();
    };

    // Tab-Labels und -Inhalte extrahieren
    const tabs = React.Children.toArray(children);

    return (
        <div className="tabs-container">
            <div className="tabs-navigation">
                {showLeftArrow && (
                    <button className="scroll-button scroll-left" onClick={scrollLeft}>
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                )}

                <div
                    className="tabs-header"
                    ref={tabsHeaderRef}
                    onScroll={handleScroll}
                >
                    {tabs.map(tab => (
                        <button
                            key={tab.props.id}
                            className={`tab-button ${activeTab === tab.props.id ? 'active' : ''}`}
                            onClick={() => onChange(tab.props.id)}
                        >
                            {tab.props.label}
                        </button>
                    ))}
                </div>

                {showRightArrow && (
                    <button className="scroll-button scroll-right" onClick={scrollRight}>
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                )}
            </div>

            <div className="tabs-body">
                {tabs.map(tab =>
                    React.cloneElement(tab, {
                        key: tab.props.id,
                        isActive: activeTab === tab.props.id
                    })
                )}
            </div>
        </div>
    );
};