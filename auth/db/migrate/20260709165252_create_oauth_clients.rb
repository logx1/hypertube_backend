class CreateOAuthClients < ActiveRecord::Migration[8.1]
  def change
    create_table :oauth_clients do |t|
      t.string :name
      t.string :client_id
      t.string :secret_digest

      t.timestamps
    end
    add_index :oauth_clients, :client_id, unique: true
  end
end
