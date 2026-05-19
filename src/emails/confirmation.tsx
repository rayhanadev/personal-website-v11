import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";

export default function ConfirmationEmail() {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email to join my mailing list!</Preview>
      <Tailwind>
        <Body className="m-auto bg-black font-sans">
          <Container className="mx-auto mb-10 max-w-[465px] p-8">
            <Section className="mt-10">
              <Img
                src={`https://example.com/brand/example-logo.png`}
                width="60"
                height="60"
                alt="Logo Example"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-8 p-0 text-center text-2xl font-normal text-white">
              Welcome ヾ(＾∇＾)
            </Heading>
            <Text className="text-start text-sm text-white">Hi there!!!</Text>
            <Text className="text-start text-sm leading-relaxed text-white">
              Thanks for joining my mailing list! I&apos;ll shoot you an email whenever I write
              something new (maybe once in a blue moon) or if I have something useful to say!
            </Text>
            <Text className="text-start text-sm leading-relaxed text-white">
              Before I do that though, please confirm your email address so I know I&apos;m talking
              to a real human! d[o_0]b
            </Text>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="w-full rounded-md py-5 text-center text-sm font-semibold text-white no-underline"
                href="https://rayhanadev.com/mailing/confirm"
              >
                Confirm Email
              </Button>
            </Section>
            <Text className="text-start text-sm text-white">
              Thank you!
              <br />
              Ray Arayilakath :)
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
