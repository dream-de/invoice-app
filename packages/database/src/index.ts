import { Prisma } from "@prisma/client"

export * from "@prisma/client"
export { prisma } from "./client"

export const prismaDbNull = Prisma.DbNull
