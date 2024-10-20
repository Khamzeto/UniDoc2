'use client';

import { Grid } from '@mantine/core';
import TemplateCreator from '@/components/CreateTemplate/CreateTemplate';
import { FaqDocument } from '@/components/FaqDocument/FaqDocument';
import { HeaderMegaMenu } from '@/components/HeaderMegaMenu/HeaderMegaMenu';
import { NavbarSearch } from '@/components/NavbarSearch/NavbarSearch';
import { SubmitDocumentForm } from '@/components/SubmitDocument/SubmitDocument';

import '../global.css';

export default function SubmitDocumentPage() {
  return (
    <>
      <HeaderMegaMenu />
      <Grid gutter="xl" className="grid" pr="20">
        {/* Левая колонка с навигацией */}
        <Grid.Col span={3}>
          <NavbarSearch />
        </Grid.Col>

        {/* Правая колонка с формой */}
        <Grid.Col w="100%" mt="100">
          <TemplateCreator /> {/* Используем компонент формы */}
        </Grid.Col>
      </Grid>
    </>
  );
}
