import { Metadata } from 'next';
import { defaultMetadata } from './metadata';
import RootLayoutClient from './layout-client';

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <RootLayoutClient>{children}</RootLayoutClient>
            </body>
        </html>
    );
}
