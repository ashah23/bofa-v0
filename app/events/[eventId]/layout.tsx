import React from 'react';

type LayoutProps = {
    children: React.ReactNode;
    heat: React.ReactNode;
    doubleElim: React.ReactNode;
    groupKnockout: React.ReactNode;
};

export default function EventLayout({
    children,
    heat,
    doubleElim,
    groupKnockout,
}: LayoutProps) {
    return (
        <div>
            {children}
            {heat}
            {doubleElim}
            {groupKnockout}
        </div>
    );
} 