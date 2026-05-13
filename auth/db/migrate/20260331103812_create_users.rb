class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :username, null: false, limit: 30, index: { unique: true }
      t.string :first_name, null: false, limit: 30
      t.string :last_name, null: false, limit: 30
      t.string :email, null: false, limit: 30, index: { unique: true }
      t.string :password_digest, null: false
      t.text :imageUrl, null: true
      t.string :language, null: false, default: "en"

      t.timestamps
    end
  end
end