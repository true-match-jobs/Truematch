import { prisma } from '../config/prisma';

const DEFAULT_RETAIN_LIMIT = 50;

type DeleteCountRow = {
  deleteCount: bigint;
};

type ArgOptions = {
  retainLimit: number;
  isDryRun: boolean;
};

const parseArgs = (argv: string[]): ArgOptions => {
  let retainLimit = DEFAULT_RETAIN_LIMIT;
  let isDryRun = false;

  argv.forEach((arg) => {
    if (arg === '--dry-run') {
      isDryRun = true;
      return;
    }

    if (arg.startsWith('--limit=')) {
      const rawLimit = arg.split('=')[1];
      const parsedLimit = Number.parseInt(rawLimit, 10);

      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        throw new Error('Invalid --limit value. Use a positive integer.');
      }

      retainLimit = parsedLimit;
    }
  });

  return {
    retainLimit,
    isDryRun
  };
};

const countMessagesToDelete = async (retainLimit: number): Promise<number> => {
  const rows = await prisma.$queryRaw<DeleteCountRow[]>`
    SELECT COUNT(*)::bigint AS "deleteCount"
    FROM (
      SELECT
        "id",
        ROW_NUMBER() OVER (
          PARTITION BY LEAST("fromUserId", "toUserId"), GREATEST("fromUserId", "toUserId")
          ORDER BY "createdAt" DESC, "id" DESC
        ) AS row_num
      FROM "ChatMessage"
    ) ranked
    WHERE ranked.row_num > ${retainLimit}
  `;

  const deleteCount = rows[0]?.deleteCount ?? BigInt(0);

  return Number(deleteCount);
};

const trimChatHistory = async (retainLimit: number): Promise<number> => {
  const deletedRows = await prisma.$executeRaw`
    WITH ranked AS (
      SELECT
        "id",
        ROW_NUMBER() OVER (
          PARTITION BY LEAST("fromUserId", "toUserId"), GREATEST("fromUserId", "toUserId")
          ORDER BY "createdAt" DESC, "id" DESC
        ) AS row_num
      FROM "ChatMessage"
    )
    DELETE FROM "ChatMessage" AS chat_message
    USING ranked
    WHERE chat_message."id" = ranked."id"
      AND ranked.row_num > ${retainLimit}
  `;

  return deletedRows;
};

const main = async (): Promise<void> => {
  const { retainLimit, isDryRun } = parseArgs(process.argv.slice(2));

  console.log(`[chat-history-trim] Starting ${isDryRun ? 'dry run' : 'cleanup'} with retain limit: ${retainLimit}`);

  const messagesToDelete = await countMessagesToDelete(retainLimit);

  if (messagesToDelete === 0) {
    console.log('[chat-history-trim] No messages exceed retention limit. Nothing to do.');
    return;
  }

  console.log(`[chat-history-trim] Messages exceeding retention: ${messagesToDelete}`);

  if (isDryRun) {
    console.log('[chat-history-trim] Dry run complete. No rows were deleted.');
    return;
  }

  const deletedRows = await trimChatHistory(retainLimit);
  console.log(`[chat-history-trim] Cleanup complete. Deleted rows: ${deletedRows}`);
};

void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[chat-history-trim] Failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
