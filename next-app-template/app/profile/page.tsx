'use client';

import { Grid } from '@mantine/core';
import { FaqDocument } from '@/components/FaqDocument/FaqDocument';
import { HeaderMegaMenu } from '@/components/HeaderMegaMenu/HeaderMegaMenu';
import { NavbarSearch } from '@/components/NavbarSearch/NavbarSearch';
import { NotificationSolo } from '@/components/Notification/Notification';
import { SubmitDocumentForm } from '@/components/SubmitDocument/SubmitDocument';
import UserProfile from '@/components/UserProfile/UserProfile';

import '../global.css';

export default function SubmitDocumentPage() {
  return (
    <>
      <HeaderMegaMenu />
      <NotificationSolo />
      <Grid gutter="xl" className="grid" pr="20">
        {/* Левая колонка с навигацией */}
        <Grid.Col span={3}>
          <NavbarSearch />
        </Grid.Col>

        {/* Правая колонка с формой */}
        <Grid.Col>
          <UserProfile />
        </Grid.Col>
      </Grid>
    </>
  );
}
