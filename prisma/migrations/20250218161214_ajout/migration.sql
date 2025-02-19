-- CreateTable
CREATE TABLE "test" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "comment" VARCHAR(255) NOT NULL,

    CONSTRAINT "test_pkey" PRIMARY KEY ("id")
);
