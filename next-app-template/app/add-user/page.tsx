'use client';

import { Grid } from '@mantine/core';
import { AddUsersPage } from '@/components/AddUsers/AddUsers';
import { FaqDocument } from '@/components/FaqDocument/FaqDocument';
import { HeaderMegaMenu } from '@/components/HeaderMegaMenu/HeaderMegaMenu';
import { NavbarSearch } from '@/components/NavbarSearch/NavbarSearch';
import { SubmitDocumentForm } from '@/components/SubmitDocument/SubmitDocument';

export default function SubmitDocumentPage() {
  return (
    <>
      <Grid gutter="xl" pl="20" pr="20">
        {/* Левая колонка с навигацией */}
        <Grid.Col span={3}>
          <NavbarSearch />
        </Grid.Col>

        {/* Правая колонка с формой */}
        <Grid.Col mt="80" span={9}>
          <AddUsersPage />
        </Grid.Col>
      </Grid>
    </>
  );
}
