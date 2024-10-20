'use client';

import { Flex, Grid } from '@mantine/core';
import { FaqDocument } from '@/components/FaqDocument/FaqDocument';
import { HeaderMegaMenu } from '@/components/HeaderMegaMenu/HeaderMegaMenu';
import DocumentRequestsPage from '@/components/MyRequests/MyRequests';
import { NavbarSearch } from '@/components/NavbarSearch/NavbarSearch';
import { NotificationSolo } from '@/components/Notification/Notification';
import { SubmitDocumentForm } from '@/components/SubmitDocument/SubmitDocument';
import { UserNotification } from '@/components/UserNotification/UserNotification';

export default function SubmitDocumentPage() {
  return (
    <>
      <HeaderMegaMenu />
      <NotificationSolo />
      <Flex pl="20" pr="20" align="start">
        {/* Левая колонка с навигацией */}
        <Flex direction="column" justify="start" align="start" style={{ width: '10%' }}>
          <NavbarSearch />
        </Flex>

        {/* Правая колонка с формой */}
        <Flex direction="column" justify="start" align="start" mt="110" style={{ width: '80%' }}>
          <UserNotification />
        </Flex>
      </Flex>
    </>
  );
}
