import prisma from '../common/prisma';
import { generateSlug } from './string.util';

/**
 * Generate a unique team slug based on email
 */
export async function generateUniqueTeamSlug(email: string): Promise<{ name: string; slug: string }> {
  const emailPrefix = email.split('@')[0];
  const teamName = `${emailPrefix}'s Team`;
  const baseSlug = generateSlug(teamName);
  
  // Generate unique slug
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.team.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return { name: teamName, slug };
}

