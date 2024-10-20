'use client';

import { Flex, Grid } from '@mantine/core';
import CheckRequests from '@/components/CheckRequests/CheckRequests';
import { FaqDocument } from '@/components/FaqDocument/FaqDocument';
import { HeaderMegaMenu } from '@/components/HeaderMegaMenu/HeaderMegaMenu';
import DocumentRequestsPage from '@/components/MyRequests/MyRequests';
import { NavbarSearch } from '@/components/NavbarSearch/NavbarSearch';
import { SubmitDocumentForm } from '@/components/SubmitDocument/SubmitDocument';

export default function SubmitDocumentPage() {
  return (
    <>
      <HeaderMegaMenu />
      <Flex pl="20" pr="20" align="start">
        {/* Левая колонка с навигацией */}
        <Flex direction="column" justify="start" align="start" style={{ width: '10%' }}>
          <NavbarSearch />
        </Flex>

        {/* Правая колонка с формой */}
        <Flex direction="column" justify="start" align="start" mt="110" style={{ width: '92%' }}>
          <CheckRequests />
        </Flex>
      </Flex>
    </>
  );
}
