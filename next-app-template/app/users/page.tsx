'use client';

import { Flex, Grid } from '@mantine/core';
import CheckRequests from '@/components/CheckRequests/CheckRequests';
import { FaqDocument } from '@/components/FaqDocument/FaqDocument';
import { HeaderMegaMenu } from '@/components/HeaderMegaMenu/HeaderMegaMenu';
import DocumentRequestsPage from '@/components/MyRequests/MyRequests';
import { NavbarSearch } from '@/components/NavbarSearch/NavbarSearch';
import SignatureRequests from '@/components/SignatureRequests/SignatureRequests';
import { SubmitDocumentForm } from '@/components/SubmitDocument/SubmitDocument';
import { UsersTable } from '@/components/Users/UsersTable';

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
        <Flex direction="column" justify="flex-end" align="end" mt="110" style={{ width: '92%' }}>
          <UsersTable />
        </Flex>
      </Flex>
    </>
  );
}
