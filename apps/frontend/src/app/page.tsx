import { Box, Button, Container, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DASHBOARD, LOGIN } from '@/constants/routes';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(DASHBOARD);
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="6xl" py={{ base: 12, md: 24 }}>
        <Stack gap={12} textAlign="center" align="center">
          <Heading as="h1" size="5xl" lineHeight="short" fontWeight="extrabold">
            The Job Hunting App for Software Engineers
          </Heading>

          <Text fontSize="xl" maxW="3xl">
            Stop wasting hours scanning job posts. Leverage LLMs to surface offers that match your
            skills and preferences.
          </Text>

          <HStack gap={4} justify="center">
            <Button colorScheme="teal" size="lg" px={8} py={6} borderRadius="md">
              Get Started
            </Button>
            <Button variant="ghost" size="lg" px={6} py={6} borderRadius="md">
              See GitHub
            </Button>
          </HStack>
        </Stack>
      </Container>
    </Box>
  );
}
