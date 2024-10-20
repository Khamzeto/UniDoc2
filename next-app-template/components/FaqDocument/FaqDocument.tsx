import { Accordion, Title } from '@mantine/core';
import classes from './FaqDocument.module.css';

const placeholder =
  'Этот процесс обычно занимает 3-5 рабочих дней. После отправки заявления вы сможете отслеживать его статус в личном кабинете.';

export function FaqDocument() {
  return (
    <div className={classes.wrapper}>
      <Title ta="center" className={classes.title}>
        Часто задаваемые вопросы
      </Title>

      <Accordion variant="separated">
        <Accordion.Item className={classes.item} value="how-long">
          <Accordion.Control>Сколько времени занимает обработка заявления?</Accordion.Control>
          <Accordion.Panel>{placeholder}</Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value="status-tracking">
          <Accordion.Control>Как я могу отслеживать статус своего заявления?</Accordion.Control>
          <Accordion.Panel>
            После отправки заявления вы получите уведомления на электронную почту. Также вы можете
            отслеживать статус заявления в личном кабинете.
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value="document-upload">
          <Accordion.Control>Могу ли я приложить документы к заявлению?</Accordion.Control>
          <Accordion.Panel>
            Да, система позволяет загружать дополнительные документы в формате PDF, JPEG или PNG.
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value="signing">
          <Accordion.Control>Нужно ли подписывать заявление?</Accordion.Control>
          <Accordion.Panel>
            Да, для большинства заявлений требуется электронная подпись. Вы можете подписать
            заявление с помощью своей ЭЦП прямо в системе.
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value="submission-method">
          <Accordion.Control>Можно ли подать заявление лично?</Accordion.Control>
          <Accordion.Panel>
            Все заявления принимаются через онлайн-систему для удобства и ускорения процесса.
            Однако, при необходимости, вы можете обратиться в деканат лично.
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
