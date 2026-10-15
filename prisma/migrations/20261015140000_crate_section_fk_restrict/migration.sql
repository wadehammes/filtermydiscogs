ALTER TABLE "crate_releases" DROP CONSTRAINT "crate_releases_user_id_crate_id_section_id_fkey";

ALTER TABLE "crate_releases" ADD CONSTRAINT "crate_releases_user_id_crate_id_section_id_fkey" FOREIGN KEY ("user_id", "crate_id", "section_id") REFERENCES "crate_set_markers"("user_id", "crate_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "crate_set_markers" DROP CONSTRAINT "crate_set_markers_user_id_crate_id_parent_id_fkey";

ALTER TABLE "crate_set_markers" ADD CONSTRAINT "crate_set_markers_user_id_crate_id_parent_id_fkey" FOREIGN KEY ("user_id", "crate_id", "parent_id") REFERENCES "crate_set_markers"("user_id", "crate_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
